const sharp = require("sharp");
const crypto = require("crypto");
const os = require("os");
const fs = require("fs-extra");
const path = require("path");

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

      console.log(
        `Successfully converted WEBP extract image to PNG: ${fileName}`
      );

      return 200;
    } catch (e) {
      console.error(
        `Error converting image from WEBP to PNG - quitting ${fileName}: ${e?.message}`
      );
      return 422;
    }
  };

  SkylabStudio.prototype.downloadExtract = async function downloadExtract(
    file,
    job,
    bgBuffers,
    adaptiveFiltering,
    outputDir,
    fileName
    // metaSrc?
  ) {
    try {
      const replaceBg = job.profile.replaceBackground;

      // Color buffer
      let colorJpgB64 = await sharp(file)
        .withMetadata()
        .removeAlpha()
        .toBuffer();
      // Alpha buffer
      let alphaPngB64 = await sharp(file).extractChannel("alpha").toBuffer();

      // Get height/width of the mask
      let {
        width = 0,
        height = 0,
        density = 72,
        icc = undefined,
      } = await sharp(file).metadata();
      // If its a replace bg job
      if (bgBuffers && bgBuffers.length > 0 && replaceBg) {
        logger.info(
          `Job ${job.name} - Applying pre background image mask ${fileName}`
        );

        const alphaChannelBuffer = await sharp(alphaPngB64)
          .extractChannel("red")
          .toBuffer();

        const rgbCutout = await sharp(colorJpgB64)
          .withMetadata()
          .ensureAlpha()
          .joinChannel(alphaChannelBuffer)
          .png()
          .toBuffer();

        // for (let i = 0; i < bgBuffers.length; i++) {
        //   let bgReplacedFileName = fileName;
        //   // Only change the output image names if theres more than 1 bg
        //   if (
        //     bgBuffers.length > 1 ||
        //     (bgBuffers.length === 1 &&
        //       job.profile.outputFileType === "png" &&
        //       job.profile.dualFileOutput)
        //   ) {
        //     // Need to assign new names so they don't overwrite themselves.
        //     const name = `${fileName.split(".").slice(0, -1)} (${
        //       bgBuffers[i].name
        //     })`;
        //     const ext = fileName.split(".").pop();
        //     bgReplacedFileName = `${name}.${ext}`;
        //   }

        //   const resizedBgImage = await sharp(bgBuffers[i].data)
        //     .resize({ width, height })
        //     .toBuffer();
        //   try {
        //     // Append mask to resized bg image
        //     const sharpInstance = await sharp(resizedBgImage).composite([
        //       { input: rgbCutout },
        //     ]);

            // await writeBgReplaceFile(
            //   adaptiveFiltering,
            //   sharpInstance,
            //   outputDir,
            //   bgReplacedFileName,
            //   job.name,
            //   job.profile.outputFileType,
            //   metaSrc,
            //   job.profile.enableStripPngMetadata
            // );
      //     } catch (err) {
      //       logger.error(
      //         `Job ${job.name} - Error applying image mask to background for ${bgReplacedFileName}: ${err}`
      //       );
      //       return Promise.resolve(422);
      //     }
      //   }

      //   return Promise.resolve(200);
      // }

      // logger.info(
      //   `Job ${job.name} - Attempting to convert & download ${fileName} with adaptive row filtering: ${adaptiveFiltering}`
      // );

      // NON PSD - NO BG REPLACE
      await this.downloadWebpAsPng(
        file,
        outputPath,
        fileName,
        enableStripPngMetadata
      );

      logger.info(
        `Job ${job.name} - Successfully downloaded extract image: ${fileName} to ${outputDir}`
      );
      return Promise.resolve(200);
    } catch (err) {
      logger.error(
        `Job ${job.name} - Error downloading extract zip file: ${err.message}`
      );
      return Promise.resolve(422);
    }
  };

  SkylabStudio.prototype.attemptImageConversion =
    async function attemptImageConversion(
      file,
      conversionType,
      stripMetadata = false
    ) {
      if (!file || !conversionType)
        throw Error("File and conversion type are required");

      let convertedImage = null;

      if (conversionType === "webp") {
        convertedImage = await sharp(file)
          .keepMetadata()
          .webp({ effort: 5, quality: 97 })
          .toBuffer();
      } else if (conversionType === "jpg") {
        convertedImage = await sharp(file)
          .keepMetadata()
          .jpeg({ quality: 95 })
          .toBuffer();
      } else if (conversionType === "png") {
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
