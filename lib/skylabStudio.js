const queryString = require("query-string");

const packageData = require("../package.json");

// LOAD ENV
const SKYLAB_API_URL =
  process.env.SKYLAB_API_URL || "https://studio.skylabtech.ai:443";

// const API_VERSION = "1";
const API_HEADER_KEY = "X-SLT-API-KEY";
const API_HEADER_CLIENT = "X-SLT-API-CLIENT";
const API_CLIENT = `js-${packageData.version}`;

const SkylabStudio = function SkylabStudio(apiKey, debug) {
  this.API_KEY = apiKey;
  this.DEBUG = debug || false;

  this._debug("Debug enabled");
};

SkylabStudio.prototype._debug = function _debug(str) {
  if (this.DEBUG) {
    // eslint-disable-next-line no-console
    console.log(`SKYLABTECH: ${str}`);
  }
};

SkylabStudio.prototype._buildHeaders = function _buildHeaders() {
  const headers = { "Content-Type": "application/json" };

  headers[API_HEADER_KEY] = this.API_KEY;
  headers[API_HEADER_CLIENT] = API_CLIENT;

  this._debug(`Set headers: ${JSON.stringify(headers)}`);

  return { headers };
};

SkylabStudio.prototype._buildUrl = function _buildUrl(
  resource,
  identifier,
  action,
  params = {}
) {
  let url = `${SKYLAB_API_URL}/api/public/v1/`;

  if (resource) {
    url += resource;
  }
  if (identifier) {
    url += `/${identifier}`;
  }
  if (action) {
    url += `/${action}`;
  }

  url += queryString.stringify(params);

  this._debug(`Built url: ${url}`);

  return url;
};

SkylabStudio.prototype.handleResponse = async function handleResponse(
  response
) {
  const data = await response.json();
  if (response.ok) {
    return data;
  } else {
    const formattedResponse = {
      message: data["message"],
      status: await response.status,
    };

    return formattedResponse;
  }
};

require("./jobs")(SkylabStudio);
require("./profiles")(SkylabStudio);
require("./photos")(SkylabStudio);
require("./util")(SkylabStudio);

module.exports = function client(apiKey, debug) {
  return new SkylabStudio(apiKey, debug);
};
