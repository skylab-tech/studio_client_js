const sharp = require("sharp");
const crypto = require("crypto");
const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const exifReader = require("exif-reader");

module.exports = function photos(SkylabStudio) {
  SkylabStudio.prototype.getUploadUrl = async function getUploadUrl(data) {
    let url = this._buildUrl("photos");
    const { use_cache_upload, photo_id, content_md5 } = data;

    url += `/upload_url?use_cache_upload=${use_cache_upload}&photo_id=${photo_id}&content_md5=${encodeURIComponent(
      content_md5
    )}`;

    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.validateFile = async function validateFile(photoPath) {
    try {
      const {
        size = 0,
        width = 0,
        height = 0,
      } = await sharp(photoPath).metadata();

      return (
        size > 27 * 1024 * 1024 || // MB
        width > 6400 ||
        height > 6400 ||
        width * height > 27000000 // MP
      );
    } catch (err) {
      return true;
    }
  };

  SkylabStudio.prototype.validateHmacHeaders =
    async function validateHmacHeaders(
      secretKey,
      jobJson,
      requestTimestamp,
      signature
    ) {
      const message = `${requestTimestamp}:${jobJson}`;
      const messageBuffer = Buffer.from(message, "utf-8");

      // Create the HMAC signature using SHA-256
      const hmacDigest = crypto
        .createHmac("sha256", secretKey)
        .update(messageBuffer)
        .digest("base64");
      const generatedSig = hmacDigest.toString("utf-8");

      return signature === generatedSig;
    };

  SkylabStudio.prototype.fetchJobPhotoIds = async function fetchJobPhotoIds(
    jobId
  ) {
    const url = this._buildUrl("jobs", jobId, "photo_ids");
    const options = this._buildHeaders();
    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.downloadWebpAsPng = async function downloadWebpAsPng(
    file,
    outputDir,
    fileName,
    stripMetadata
  ) {
    try {
      await this.writeImage(file, outputDir, fileName, stripMetadata);

      return 200;
    } catch (e) {
      console.error(
        `Error converting image from WEBP to PNG - quitting ${fileName}: ${e?.message}`
      );
      return 422;
    }
  };

  SkylabStudio.prototype.readExif = function readExif(exifBuffer) {
    const EXIF_MARKER = "Exif\0\0";

    try {
      const exifData = exifReader(exifBuffer);
      return exifData;
    } catch (err) {
      try {
        console.info("~~~~~~~ PREPENDING EXIF MARKER TO BUFFER ~~~~~~~~~");
        // could not read exif data try adding exif marker and reading again
        const exifMarkerBuf = Buffer.from(EXIF_MARKER, "ascii");
        const newBuffer = Buffer.concat([exifMarkerBuf, exifBuffer]);

        const exifData = exifReader(newBuffer);
        return exifData;
      } catch (err) {
        console.error(`Could not read exif data from file`);

        return undefined;
      }
    }
  };

  SkylabStudio.prototype.getResolutionFromExif =
    async function getResolutionFromExif(inputFile) {
      // Fallback: If no exif buffer is supplied, get the density and resolution unit metadata from the src, which
      // could be either a freshly downloaded webp, or a local file.
      let exifTags;
      let XResolution;
      let YResolution;
      let resUnit;

      // Try meta resolution unit conversion
      const sharpMeta = await sharp(inputFile).metadata();
      resUnit = sharpMeta?.resolutionUnit;
      const exif = sharpMeta?.exif;
      if (exif) {
        exifTags = this.readExif(exif);
      }

      // Some X/Y res may vary - trust the X res.
      XResolution = exifTags?.Image?.XResolution;
      YResolution = exifTags?.Image?.XResolution;

      return {
        resolutionDpi: XResolution || YResolution || 72,
        resolutionUnit: resUnit,
      };
    };

  SkylabStudio.prototype.downloadExtract = async function downloadExtract(
    file,
    outputType,
    bgBuffers,
    enableStripPngMetadata,
    dualFileOutput,
    outputDir,
    fileName,
    metaSrc
  ) {
    fileName = fileName.split(".").slice(0, -1).concat("png").join(".");
    try {
      const { resolutionDpi } = await this.getResolutionFromExif(file);

      // Color buffer
      let colorJpgB64 = await sharp(file)
        .withMetadata({ density: resolutionDpi })
        .keepMetadata()
        .removeAlpha()
        .toBuffer();

      // Alpha buffer
      let alphaPngB64 = await sharp(file).extractChannel("alpha").toBuffer();

      // Get height/width of the mask
      let { width = 0, height = 0 } = await sharp(file).metadata();

      // If its a replace bg job
      if (bgBuffers && bgBuffers.length > 0) {
        const alphaChannelBuffer = await sharp(alphaPngB64)
          .extractChannel("red")
          .toBuffer();

        const rgbCutout = await sharp(colorJpgB64)
          .withMetadata({ density: resolutionDpi })
          .keepMetadata()
          .ensureAlpha()
          .joinChannel(alphaChannelBuffer)
          .png()
          .toBuffer();

        for (let i = 0; i < bgBuffers.length; i++) {
          let bgReplacedFileName = fileName;
          // Only change the output image names if theres more than 1 bg or there is dualFileOutput enabled
          if (
            bgBuffers.length > 1 ||
            (bgBuffers.length === 1 && outputType === "png" && dualFileOutput)
          ) {
            // Need to assign new names so they don't overwrite themselves.
            const name = `${fileName.split(".").slice(0, -1)} (${
              bgBuffers[i].name
            })`;
            const ext = fileName.split(".").pop();
            bgReplacedFileName = `${name}.${ext}`;
          }

          const resizedBgImage = await sharp(bgBuffers[i].data)
            .resize({ width, height })
            .toBuffer();

          try {
            let sharpInstance;
            // Append mask to resized bg image
            if (enableStripPngMetadata) {
              sharpInstance = await sharp(resizedBgImage).composite([
                { input: rgbCutout },
              ]);
            } else {
              sharpInstance = await sharp(resizedBgImage)
                .composite([{ input: rgbCutout }])
                .keepMetadata();
            }
            await this.writeBgReplaceFile(
              sharpInstance,
              outputDir,
              bgReplacedFileName,
              outputType,
              metaSrc,
              enableStripPngMetadata
            );
          } catch (err) {
            console.error(
              `Error applying image mask to background for ${bgReplacedFileName}: ${err}`
            );
            return Promise.resolve(422);
          }
        }

        return Promise.resolve(200);
      }

      console.info(`Attempting to convert & download ${fileName}`);

      // NO BG REPLACE
      await this.downloadWebpAsPng(
        file,
        outputDir,
        fileName,
        enableStripPngMetadata
      );

      console.info(
        `Successfully downloaded extract image: ${fileName} to ${outputDir}`
      );
      return Promise.resolve(200);
    } catch (err) {
      console.error(`Error downloading extract zip file: ${err.message}`);
      return Promise.resolve(422);
    }
  };

  SkylabStudio.prototype.writeBgReplaceFile = async function writeBgReplaceFile(
    sharpInstance,
    outputDir,
    fileName,
    outputType,
    stripPngMetadata
  ) {
    // Handles writing a bg photo
    if (stripPngMetadata) {
      return await sharpInstance
        .png({ adaptiveFiltering: true })
        .toFile(`${outputDir}/${fileName}`);
    }

    let file;
    // since we adjust the sharp instance down below, we need to create this as a source of metadata before it gets wiped.
    try {
      if (outputType === "jpg") {
        fileName = `${fileName.substring(0, fileName.lastIndexOf("."))}.jpg`;
        file = await sharpInstance
          .jpeg({ quality: 95 })
          .rotate()
          .toFile(`${outputDir}/${fileName}`);
      } else {
        // await sharpInstance.toFile(`${outputDir}/doggg-${fileName}`);
        file = await sharpInstance
          .png({ adaptiveFiltering: true })
          .toFile(`${outputDir}/${fileName}`);
      }
    } catch (e) {
      console.error("Error writing replace bg file occurred");
    }

    console.info(
      `Successfully downloaded extracted background replace image: ${fileName}`
    );
  };

  SkylabStudio.prototype.attemptImageConversion =
    async function attemptImageConversion(
      file,
      conversionType,
      stripMetadata = false
    ) {
      if (!file || !conversionType)
        throw Error("File and conversion type are required");

      const { resolutionDpi } = await this.getResolutionFromExif(file);

      let convertedImage = null;

      if (conversionType === "webp") {
        convertedImage = await sharp(file)
          .withMetadata({ density: resolutionDpi })
          .keepMetadata()
          .webp({ effort: 5, quality: 97 })
          .toBuffer();
      } else if (conversionType === "jpg") {
        convertedImage = await sharp(file)
          .withMetadata({ density: resolutionDpi })
          .keepMetadata()
          .jpeg({ quality: 95 })
          .toBuffer();
      } else if (conversionType === "png") {
        // todo - i dont think this works
        // Sharp is not able to transfer metadata when writing PNGs. Use exiftool
        stripMetadata
          ? (convertedImage = await sharp(file)
              .png({ adaptiveFiltering: true })
              .toBuffer())
          : (convertedImage = await sharp(file)
              .keepMetadata()
              .png({ adaptiveFiltering: true })
              .toBuffer());
      }

      return convertedImage;
    };

  SkylabStudio.prototype.writeImage = async function writeImage(
    file,
    outputDir,
    fileName,
    stripMetadata
  ) {
    const sharpImageBuffer = await this.attemptImageConversion(
      file,
      "png",
      stripMetadata
    );

    if (sharpImageBuffer === null) throw Error("Sharp buffer null");

    // Either write or strip metadata
    if (stripMetadata) {
      const strippedMetadataImageBuffer = await sharp(
        sharpImageBuffer
      ).toBuffer();

      await fs.writeFile(
        path.join(outputDir, fileName),
        strippedMetadataImageBuffer,
        () => {}
      );
    } else {
      await fs.writeFile(
        path.join(outputDir, fileName),
        sharpImageBuffer,
        () => {}
      );
    }
  };
};
