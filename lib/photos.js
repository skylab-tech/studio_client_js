const path = require("node:path");
const fs = require("fs-extra");
const crypto = require("crypto");
const PromisePool = require("es6-promise-pool");
const download = require("download");

let fileTypeModule;
async function loadFileType() {
  fileTypeModule = await import("file-type");
}

loadFileType();

module.exports = function photos(SkylabStudio) {
  SkylabStudio.prototype.listPhotos = async function listPhotos() {
    const url = this._buildUrl("photos", null, null);

    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

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

  const promiseProducer = function (urls) {};

  SkylabStudio.prototype.downloadPhoto = async function downloadPhoto(
    photoId,
    outputPath
  ) {
    const photo = await this.getPhoto(photoId);
    const fileName = photo["name"];
    const profileId = photo["job"]["profileId"];
    const profile = await this.getProfile(profileId);
    console.log("~~~~profile~~~", profile);

    const isExtract = profile["enableExtract"];
    const isDualFileOutput = profile["dualFileOutput"];

    const file = await download(photo["retouchedUrl"]);
    console.log("photo", photo["retouchedUrl"]);

    if (isExtract) {
      if (isDualFileOutput) {
        await this.downloadWebpAsPng(
          file,
          outputPath,
          fileName,
          profile["enableStripPngMetadata"]
        );
      }
    } else {
      // check file type, if webp, original image is a png - convert it back
      const fileType = await fileTypeModule.fileTypeFromBuffer(file);

      let type = fileType?.mime;

      // convert webp to png
      if (type === "image/webp") {
        const resCode = await this.downloadWebpAsPng(
          file,
          outputPath,
          fileName,
          profile["enableStripPngMetadata"]
        );

        if (resCode !== 200) return Promise.resolve(422);
      } else {
        // original image not a png - no conversion required - write the image
        await fs.writeFile(path.join(outputPath, fileName), file);
      }

      console.info(`Successfully downloaded: ${fileName}`);
      return Promise.resolve(200);
    }
  };

  SkylabStudio.prototype.downloadPhotos = async function downloadPhotos(jobId) {
    console.log("downloading extract photo...");

    const urls = await this.fetchJobPhotoUrls(jobId);

    const pool = new PromisePool(promiseProducer, 5);
    // Start the pool.
    const poolPromise = pool.start();

    // Wait for the pool to settle.
    poolPromise.then(
      function () {
        console.log("All promises fulfilled");
      },
      function (error) {
        console.log("Some promise rejected: " + error.message);
      }
    );
    console.log("resp", urls);
  };

  SkylabStudio.prototype.deletePhoto = async function deletePhoto(photoId) {
    const url = this._buildUrl("photos", photoId);

    const options = this._buildHeaders();
    options.method = "DELETE";

    const resp = await fetch(url, options);
    console.log("respz", resp.data);
    // return this.handleResponse(resp);
  };
};
