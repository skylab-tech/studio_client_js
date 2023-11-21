const path = require("node:path");
const fs = require("fs-extra");
const crypto = require("crypto");
const base64 = require("base64-js");

module.exports = function photos(SkylabStudio) {
  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.listPhotos = async function listPhotos() {
    const url = this._buildUrl("photos", null, null);

    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  // eslint-disable-next-line no-param-reassign
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

    const file = await fs.readFile(photoPath);

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

  SkylabStudio.prototype.deletePhoto = async function deletePhoto(photoId) {
    const url = this._buildUrl("photos", photoId);

    const options = this._buildHeaders();
    options.method = "DELETE";

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };
};
