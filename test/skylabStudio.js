const { assert } = require("chai");
const sinon = require("sinon");

const skylabStudio = require("../lib/skylabStudio");

const API_KEY = "API_CLIENT_TEST_KEY";

describe("Skylab Studio API client", () => {
  let client;

  before((done) => {
    client = skylabStudio(API_KEY);

    done();
  });

  describe("_buildHeaders", () => {
    it("should build the headers", (done) => {
      const headers = client._buildHeaders("test");

      assert.equal(Object.keys(headers).length, 2);

      done();
    });
  });

  describe("_getOptions", () => {
    it("should return options", (done) => {
      const options = client._getOptions();

      assert.isDefined(options.headers);

      done();
    });
  });

  describe("_buildUrl", () => {
    it("should build default URL", (done) => {
      const url = client._buildUrl();

      assert.equal(url, "https://studio-staging.skylabtech.ai/api/public/v1/");

      done();
    });

    it("should build URL with resource", (done) => {
      const url = client._buildUrl("jobs");

      assert.equal(
        url,
        "https://studio-staging.skylabtech.ai/api/public/v1/jobs"
      );

      done();
    });

    it("should build URL with identified", (done) => {
      const url = client._buildUrl("jobs", "1");

      assert.equal(
        url,
        "https://studio-staging.skylabtech.ai/api/public/v1/jobs/1"
      );

      done();
    });

    it("should build URL with action", (done) => {
      const url = client._buildUrl("jobs", "1", "process");

      assert.equal(
        url,
        "https://studio-staging.skylabtech.ai/api/public/v1/jobs/1/process"
      );

      done();
    });
  });
});
