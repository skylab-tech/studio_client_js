const sharp = require("sharp");
const crypto = require("crypto");

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
};
