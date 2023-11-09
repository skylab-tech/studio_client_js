module.exports = function profiles(SkylabStudio) {
  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.listProfiles = async function listProfiles() {
    const url = this._buildUrl("profiles");
    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.createProfile = async function createProfile(data) {
    const url = this._buildUrl("profiles");
    const options = this._buildHeaders();

    options.method = "POST";
    options.body = JSON.stringify(data);

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.getProfile = async function getProfile(id) {
    const url = this._buildUrl("profiles", id);
    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  // eslint-disable-next-line no-param-reassign
  SkylabStudio.prototype.updateProfile = async function updateProfile(
    id,
    data
  ) {
    const url = this._buildUrl("profiles", id);

    const options = this._buildHeaders();
    options.method = "PATCH";
    options.body = JSON.stringify(data);

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };
};
