const restler = require('restler');

module.exports = function jobs(SkylabStudio) {
  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.listJobs = function listJobs(data, callback) {
    const url = this._buildUrl('jobs', null, null, data.params);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'GET', url, options.headers, data);

    restler.get(url, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.createJob = function createJob(data, callback) {
    const url = this._buildUrl('jobs');

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'POST', url, options.headers, {});

    restler.postJson(url, data, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.getJob = function getJob(data, callback) {
    const url = this._buildUrl('jobs', data.id);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'GET', url, options.headers, {});

    restler.get(url, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.updateJob = function updateJob(data, callback) {
    const url = this._buildUrl('jobs', data.id);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'PATCH', url, options.headers, {});

    restler.patchJson(url, data, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.deleteJob = function deleteJob(data, callback) {
    const url = this._buildUrl('jobs', data.id);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'DELETE', url, options.headers, {});

    restler.del(url, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.processJob = function processJob(data, callback) {
    const url = this._buildUrl('jobs', data.id, 'process');

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'POST', url, options.headers, {});

    restler.post(url, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.cancelJob = function cancelJob(data, callback) {
    const url = this._buildUrl('jobs', data.id, 'cancel');

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'POST', url, options.headers, {});

    restler.post(url, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };
};
