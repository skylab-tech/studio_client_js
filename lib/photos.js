const path = require("node:path");
const fs = require("fs-extra");
const sharp = require("sharp");
const crypto = require("crypto");
const { PromisePool } = require("@supercharge/promise-pool");
const download = require("download");
const { v4: uuidv4 } = require("uuid");
const os = require("os");

let fileTypeModule;
async function loadFileType() {
  fileTypeModule = await import("file-type");
}

loadFileType();

module.exports = function photos(SkylabStudio) {
  SkylabStudio.prototype.getPhoto = async function getPhoto(photoId) {
    const url = this._buildUrl("photos", photoId);

    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.createPhoto = async function createPhoto(data) {
    const url = this._buildUrl("photos");
    const options = this._buildHeaders();

    options.method = "POST";
    options.body = JSON.stringify(data);

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype._uploadPhoto = async function uploadPhoto(
    photoPath,
    id,
    model = "job"
  ) {
    const validExtensions = ["jpg", "jpeg", "png", "webp"];
    const ext = photoPath.split(".").pop();

    if (!validExtensions.includes(ext.toLowerCase()))
      throw Error("Invalid file type: must be of type jpg/jpeg/png/webp");

    const valid = this.validateFile(photoPath);

    if (!valid)
      throw Error(
        "Invalid file size: must be within 6400x6400, and no larger than 27MB"
      );
    const response = {};

    const photoName = path.basename(photoPath);

    const uploadHeaders = {};

    let file = await fs.readFile(photoPath);
    if (ext === "png") {
      file = await this.attemptImageConversion(file, "webp");
    }

    let md5;
    let hashSum = crypto.createHash("md5");
    hashSum.update(file);
    md5 = hashSum.digest("base64");

    const photoData = {
      [`${model}_id`]: id,
      name: photoName,
      use_cache_upload: false,
    };

    if (model == "job") {
      const job = await this.getJob(id);
      if (job["type"] == "regular")
        uploadHeaders["X-Amz-Tagging"] = "job=photo&api=true";
    }

    // Create Studio photo record
    const photoResp = await this.createPhoto(photoData);

    // Response status was not 'ok' - see formattedResponse in handleResponse
    if (photoResp.status) {
      throw Error(
        "Unable to create the photo object, if creating profile photo, ensure enable_extract and replace_background is set to: True. Ensure the photo name is unique."
      );
    }

    response["photo"] = photoResp;
    const photoId = photoResp["id"];

    const uploadUrlPayload = {
      use_cache_upload: false,
      photo_id: photoId,
      content_md5: md5,
    };

    const uploadUrlResp = await this.getUploadUrl(uploadUrlPayload);

    const uploadUrl = uploadUrlResp["url"];
    uploadHeaders["Content-MD5"] = md5;

    let uploadPhotoResp;
    try {
      uploadPhotoResp = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: uploadHeaders,
      });

      if (!uploadPhotoResp.ok) {
        console.log(`First upload attempt failed, retrying...`);

        let retry = 0;

        while (retry < 3) {
          uploadPhotoResp = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: uploadHeaders,
          });

          if (uploadPhotoResp.ok) {
            break; // Upload was successful, exit the loop
          } else if (retry === 2) {
            throw new Error("Unable to upload to the bucket after retrying.");
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for a moment before retrying (1 second)
            retry += 1;
          }
        }
      }
    } catch (error) {
      console.log(
        `An exception of type ${error.name} occurred: ${error.message}`
      );
      console.log("Deleting created, but unuploaded photo...");

      this.deletePhoto(photoId);
      response["photo"] = null;
    }

    response["upload_response"] = uploadPhotoResp.status;
    return response;
  };

  SkylabStudio.prototype.uploadJobPhoto = async function uploadJobPhoto(
    photoPath,
    id
  ) {
    return this._uploadPhoto(photoPath, id);
  };

  SkylabStudio.prototype.uploadProfilePhoto = async function uploadProfilePhoto(
    photoPath,
    id
  ) {
    return this._uploadPhoto(photoPath, id, "profile");
  };

  SkylabStudio.prototype.downloadPhoto = async function downloadPhoto(
    photoId,
    outputPath,
    profile = null
  ) {
    console.log("downloading photo...", photoId);
    const photo = await this.getPhoto(photoId);
    const fileName = photo["name"];

    let isExtract;
    let isDualFileOutput;
    let enableStripPngMetadata;
    let isBgReplace;
    let outputType;

    if (profile) {
      isExtract = profile["enableExtract"];
      isDualFileOutput = profile["dualFileOutput"];
      enableStripPngMetadata = profile["enableStripPngMetadata"];
      isBgReplace = profile["replaceBackground"];
      outputType = profile["outputFileType"];
    } else {
      // Fetch profile and assign necessary vars
      const profileId = photo["job"]["profileId"];
      const fetchedProfile = await this.getProfile(profileId);

      isExtract = fetchedProfile["enableExtract"];
      isDualFileOutput = fetchedProfile["dualFileOutput"];
      enableStripPngMetadata = fetchedProfile["enableStripPngMetadata"];
      isBgReplace = fetchedProfile["replaceBackground"];
      outputType = fetchedProfile["outputFileType"];
    }

    let file;
    try {
      file = await download(photo["retouchedUrl"]);
    } catch (e) {
      console.log(
        `Unable to download file: { message: ${e.statusMessage}, code: ${e.statusCode} }`
      );
      console.info(
        "Ensure the job has been queued/successfully processed, and that the job is newer than 2 weeks old."
      );
    }
    const finalResp = { id: photoId };

    let tmpBgPaths = [];
    if (isExtract) {
      // If dual output is on, handle that first.
      if (isDualFileOutput) {
        await this.downloadWebpAsPng(
          file,
          outputPath,
          fileName,
          enableStripPngMetadata
        );
      }

      let bgs = [];
      if (isBgReplace) {
        try {
          // collect bg photos
          const bgData = profile["photos"].filter((photo) => !photo.jobId);

          for (let i = 0; i < bgData.length; i++) {
            tmpBgName = uuidv4();
            tmpBgPath = path.join(os.tmpdir(), tmpBgName);
            const bg = await download(bgData[i].originalUrl);
            await fs.writeFile(tmpBgPath, bg);
            tmpBgPaths.push(tmpBgPath);

            const bgBuffer = await sharp(tmpBgPath).toBuffer();
            // path.parse(bgData[i].name).name - get bg file name without extension
            bgs.push({
              name: path.parse(bgData[i].name).name,
              data: bgBuffer,
            });
          }
        } catch (e) {
          console.error(`Something went wrong with background replace: ${e}`);
          return;
        }
      }

      const res = await this.downloadExtract(
        file,
        outputType,
        bgs,
        enableStripPngMetadata,
        isDualFileOutput,
        outputPath,
        fileName
      );

      finalResp.status = res;
      if (tmpBgPaths.length) finalResp.tmpBgPaths = tmpBgPaths;

      return finalResp;
    } else {
      // - NOT EXTRACT -
      // check file type, if webp, original image is a png - convert it back
      const fileType = await fileTypeModule.fileTypeFromBuffer(file);

      let type = fileType?.mime;

      // convert webp to png
      if (type === "image/webp") {
        console.log("file name", outputPath, fileName);
        const resCode = await this.downloadWebpAsPng(
          file,
          outputPath,
          fileName,
          enableStripPngMetadata
        );

        if (resCode !== 200) {
          finalResp.status = 422;
          if (tmpBgPaths.length) finalResp.tmpBgPaths = tmpBgPaths;

          return finalResp;
        }
      } else {
        // original image not a png - no conversion required - write the image
        await fs.writeFile(path.join(outputPath, fileName), file);
      }

      console.info(`Successfully downloaded: ${fileName}`);
      finalResp.status = 200;
      if (tmpBgPaths.length) finalResp.tmpBgPaths = tmpBgPaths;

      return finalResp;
    }
  };

  SkylabStudio.prototype.downloadPhotos = async function downloadPhotos(
    jobId,
    outputPath
  ) {
    const job = await this.getJob(jobId);
    const profileId = job["profile"]["id"];
    const profile = await this.getProfile(profileId);

    const photoIds = await this.fetchJobPhotoIds(jobId);

    const { results, errors } = await PromisePool.withConcurrency(5)
      .for(photoIds)
      .process(async (photoId, _index, _pool) => {
        return await this.downloadPhoto(photoId, outputPath, profile);
      });

    if (results[0] && results[0].tmpBgPaths && results[0].tmpBgPaths.length) {
      results[0].tmpBgPaths.map((tmpBgPath) => {
        fs.remove(tmpBgPath);
      });
    }

    return results.map(({ status, id }) => ({
      status,
      id,
    }));
  };

  SkylabStudio.prototype.deletePhoto = async function deletePhoto(photoId) {
    const url = this._buildUrl("photos", photoId);

    const options = this._buildHeaders();
    options.method = "DELETE";

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };
};
