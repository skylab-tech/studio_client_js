const restler = require("restler");

module.exports = function profiles(SkylabStudio) {
  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.listProfiles = function listProfiles(data, callback) {
    const url = this._buildUrl("profiles", null, null, data.params);

    const options = this._getOptions();

    const that = this;

    this.emit("request", "GET", url, options.headers, data);

    fetch(url, options)
      .then((response) => response.json())
      .then((result) => {
        that._handleResponse.call(that, result, { status: 200 }, callback);
      })
      .catch((error) => {
        that._handleResponse.call(that, error, { status: 500 }, callback);
      });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.createProfile = async function createProfile(
    data,
    callback
  ) {
    const url = this._buildUrl("profiles");
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
  SkylabStudio.prototype.getProfile = async function getProfile(id, callback) {
    const url = this._buildUrl("profiles", id);

    const options = this._getOptions();

    const that = this;

    this.emit("request", "GET", url, options.headers, {});

    resp = await fetch(url, options);

    const result = await resp.json();
    const status = resp.status;

    that._handleResponse.call(that, result, status, callback);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.updateProfile = async function updateProfile(
    data,
    callback
  ) {
    const url = this._buildUrl("profiles", data.id);

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
};
