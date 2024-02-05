module.exports = function jobs(SkylabStudio) {
  SkylabStudio.prototype.listJobs = async function listJobs() {
    const url = this._buildUrl("jobs");

    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.createJob = async function createJob(data) {
    const url = this._buildUrl("jobs");

    const options = this._buildHeaders();

    options.method = "POST";
    options.body = JSON.stringify(data);

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.getJob = async function getJob(id) {
    const url = this._buildUrl("jobs", id);

    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.getJobByName = async function getJobByName(name) {
    const baseUrl = this._buildUrl("jobs");
    const url = `${baseUrl}/find_by_name?name=${name}`;

    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.getJobsInFront = async function getJobsInFront(id) {
    const url = this._buildUrl("jobs", id, "jobs_in_front");

    const options = this._buildHeaders();

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.updateJob = async function updateJob(id, data) {
    const url = this._buildUrl("jobs", id);

    const options = this._buildHeaders();
    options.method = "PATCH";
    options.body = JSON.stringify(data);

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.deleteJob = async function deleteJob(id) {
    const url = this._buildUrl("jobs", id);

    const options = this._buildHeaders();

    options.method = "DELETE";

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.queueJob = async function queueJob(id, data) {
    const url = this._buildUrl("jobs", id, "queue");

    const options = this._buildHeaders();
    options.method = "POST";
    options.body = JSON.stringify(data);

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };

  SkylabStudio.prototype.cancelJob = async function cancelJob(id) {
    const url = this._buildUrl("jobs", id, "cancel");

    const options = this._buildHeaders();

    options.method = "POST";

    const resp = await fetch(url, options);

    return this.handleResponse(resp);
  };
};
