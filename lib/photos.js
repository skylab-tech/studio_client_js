const restler = require('restler');

module.exports = function photos(SkylabStudio) {
  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.listPhotos = function listPhotos(data, callback) {
    const url = this._buildUrl('photos', null, null, data.params);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'GET', url, options.headers, data);

    restler.get(url, data, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.createPhoto = function createPhoto(data, callback) {
    const url = this._buildUrl('photos', data.id);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'POST', url, options.headers, {});

    restler.postJson(url, data, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.getPhoto = function getPhoto(data, callback) {
    const url = this._buildUrl('photos', data.id);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'GET', url, options.headers, {});

    restler.get(url, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.updatePhoto = function updatePhoto(data, callback) {
    const url = this._buildUrl('photos', data.id);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'PATCH', url, options.headers, {});

    restler.patchJson(url, data, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.deletePhoto = function deletePhoto(data, callback) {
    const url = this._buildUrl('photos', data.id);

    const options = this._getOptions();

    const that = this;

    this.emit('request', 'DELETE', url, options.headers, {});

    restler.del(url, options).once('complete', (result, response) => {
      that._handleResponse.call(that, result, response, callback);
    });
  };
};
