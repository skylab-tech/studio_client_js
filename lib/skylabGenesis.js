const restler = require('restler');
const events = require('events');
const queryString = require('query-string');
const util = require('util');

const packageData = require('../package.json');

const API_PROTOCOL = 'https';
const API_HOST = 'genesis.skylabtech.ai';
const API_VERSION = '1';
const API_HEADER_KEY = 'X-SLT-API-KEY';
const API_HEADER_CLIENT = 'X-SLT-API-CLIENT';
const API_CLIENT = `js-${packageData.version}`;

const SkylabGenesis = function SkylabGenesis(apiKey, debug) {
  events.EventEmitter.call(this); // call the prototype ctor

  this.API_KEY = apiKey;
  this.DEBUG = debug || false;

  this._debug('Debug enabled');
};

// extend the EventEmitter
util.inherits(SkylabGenesis, events.EventEmitter);

SkylabGenesis.prototype._debug = function _debug(str) {
  if (this.DEBUG) {
    // eslint-disable-next-line no-console
    console.log(`SKYLABTECH: ${str}`);
  }
};

SkylabGenesis.prototype._buildHeaders = function _buildHeaders() {
  const headers = {};

  headers[API_HEADER_KEY] = this.API_KEY;
  headers[API_HEADER_CLIENT] = API_CLIENT;

  this._debug(`Set headers: ${JSON.stringify(headers)}`);

  return headers;
};

SkylabGenesis.prototype._getOptions = function _getOptions() {
  return {
    headers: this._buildHeaders(),
  };
};

SkylabGenesis.prototype._buildUrl = function _buildUrl(resource, identifier, action, params = {}) {
  let url = `${API_PROTOCOL}://${API_HOST}/api/v${API_VERSION}/`;

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

SkylabGenesis.prototype._handleResponse = function _handleResponse(result, response, callback) {
  const callbackIsFunction = typeof callback === 'function';

  if (result instanceof Error) {
    this._debug(`Request Error: ${result.stack}`);

    if (callbackIsFunction) {
      callback(result);
    }
  } else if (response.statusCode >= 200 && response.statusCode < 400) {
    this.emit('response', response.statusCode, result, response);
    this._debug(`Response ${response.statusCode}: ${JSON.stringify(result)}`);

    if (callbackIsFunction) {
      callback(null, result);
    }
  } else {
    this.emit('response', response.statusCode, result, response);
    this._debug(`Response ${response.statusCode}: ${JSON.stringify(result)}`);

    if (response.statusCode >= 200 && response.statusCode < 400 && callbackIsFunction) {
      callback(null, result);
    } else {
      const err = new Error(`Request failed with ${response.statusCode}`);
      err.statusCode = response.statusCode;

      if (callbackIsFunction) {
        callback(err, result);
      }
    }
  }
};


// //////////////////////////
// PUBLIC METHODS

SkylabGenesis.prototype.listJobs = function listJobs(data, callback) {
  const url = this._buildUrl('jobs', null, null, data.params);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'GET', url, options.headers, data);

  restler
    .get(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.createJob = function createJob(data, callback) {
  const url = this._buildUrl('jobs');

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'POST', url, options.headers, {});

  restler
    .postJson(url, data, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.getJob = function getJob(data, callback) {
  const url = this._buildUrl('jobs', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'GET', url, options.headers, {});

  restler
    .get(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.updateJob = function updateJob(data, callback) {
  const url = this._buildUrl('jobs', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'PATCH', url, options.headers, {});

  restler
    .patchJson(url, data, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.deleteJob = function deleteJob(data, callback) {
  const url = this._buildUrl('jobs', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'DELETE', url, options.headers, {});

  restler
    .del(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.processJob = function processJob(data, callback) {
  const url = this._buildUrl('jobs', data.id, 'process');

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'POST', url, options.headers, {});

  restler
    .post(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.cancelJob = function cancelJob(data, callback) {
  const url = this._buildUrl('jobs', data.id, 'cancel');

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'POST', url, options.headers, {});

  restler
    .post(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.listProfiles = function listProfiles(data, callback) {
  const url = this._buildUrl('profiles', null, null, data.params);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'GET', url, options.headers, data);

  restler
    .get(url, data, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.createProfile = function createProfile(data, callback) {
  const url = this._buildUrl('profiles', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'POST', url, options.headers, {});

  restler
    .postJson(url, data, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.getProfile = function getProfile(data, callback) {
  const url = this._buildUrl('profiles', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'GET', url, options.headers, {});

  restler
    .get(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.updateProfile = function updateProfile(data, callback) {
  const url = this._buildUrl('profiles', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'PATCH', url, options.headers, {});

  restler
    .patchJson(url, data, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.deleteProfile = function deleteProfile(data, callback) {
  const url = this._buildUrl('profiles', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'DELETE', url, options.headers, {});

  restler
    .del(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.listPhotos = function listPhotos(data, callback) {
  const url = this._buildUrl('photos', null, null, data.params);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'GET', url, options.headers, data);

  restler
    .get(url, data, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.createPhoto = function createPhoto(data, callback) {
  const url = this._buildUrl('photos', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'POST', url, options.headers, {});

  restler
    .postJson(url, data, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.getPhoto = function getPhoto(data, callback) {
  const url = this._buildUrl('photos', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'GET', url, options.headers, {});

  restler
    .get(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.updatePhoto = function updatePhoto(data, callback) {
  const url = this._buildUrl('photos', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'PATCH', url, options.headers, {});

  restler
    .patchJson(url, data, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

SkylabGenesis.prototype.deletePhoto = function deletePhoto(data, callback) {
  const url = this._buildUrl('photos', data.id);

  const options = this._getOptions();

  const that = this;

  this.emit('request', 'DELETE', url, options.headers, {});

  restler
    .del(url, options)
    .once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
};

module.exports = function client(apiKey, debug) {
  return new SkylabGenesis(apiKey, debug);
};
