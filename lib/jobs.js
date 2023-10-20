const restler = require("restler");

module.exports = function jobs(SkylabStudio) {
  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.listJobs = async function listJobs(callback) {
    const url = this._buildUrl("jobs", null, null, {});

    const options = this._getOptions();

    const that = this;

    this.emit("request", "GET", url, options.headers, {});

    resp = await fetch(url, options);

    const result = await resp.json();
    const status = resp.status;

    that._handleResponse.call(that, result, status, callback);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.createJob = async function createJob(data, callback) {
    const url = this._buildUrl("jobs");

    const options = this._getOptions();

    options.method = "POST";
    options.body = JSON.stringify(data);

    const that = this;

    this.emit("request", "POST", url, options.headers, {});

    resp = await fetch(url, options);

    const result = await resp.json();
    const status = resp.status;

    that._handleResponse.call(that, result, status, callback);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.getJob = async function getJob(data, callback) {
    const url = this._buildUrl("jobs", data.id);

    const options = this._getOptions();

    const that = this;

    this.emit("request", "GET", url, options.headers, {});

    resp = await fetch(url, options);

    const result = await resp.json();
    const status = resp.status;

    that._handleResponse.call(that, result, status, callback);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.updateJob = async function updateJob(data, callback) {
    const url = this._buildUrl("jobs", data.id);

    const options = this._getOptions();
    options.method = "PATCH";
    options.body = JSON.stringify(data);

    const that = this;

    this.emit("request", "PATCH", url, options.headers, {});

    resp = await fetch(url, options);

    const result = await resp.json();
    const status = resp.status;

    that._handleResponse.call(that, result, status, callback);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.deleteJob = async function deleteJob(id, callback) {
    const url = this._buildUrl("jobs", id);

    const options = this._getOptions();

    options.method = "DELETE";

    const that = this;

    this.emit("request", "DELETE", url, options.headers, {});

    resp = await fetch(url, options);

    const result = await resp.json();
    const status = resp.status;

    that._handleResponse.call(that, result, status, callback);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.processJob = function processJob(data, callback) {
    const url = this._buildUrl("jobs", data.id, "process");

    const options = this._getOptions();

    const that = this;

    this.emit("request", "POST", url, options.headers, {});

    restler.post(url, options).once("complete", (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.cancelJob = function cancelJob(data, callback) {
    const url = this._buildUrl("jobs", data.id, "cancel");

    const options = this._getOptions();

    const that = this;

    this.emit("request", "POST", url, options.headers, {});

    restler.post(url, options).once("complete", (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };
};
