const { expect } = require("chai");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const skylabStudio = require("../lib/skylabStudio");
const API_KEY = "16V7LPczUNXb6cdY7V15G5s5";

describe("Skylab Studio API client", () => {
  let client;

  before(() => {
    client = skylabStudio(API_KEY);
  });

  describe("Upload job photo", () => {
    it("should return 200 from upload process", async () => {
      const name = uuidv4();
      const payload = {
        name,
        enable_crop: false,
      };

      const profile = await client.createProfile(payload);

      const jobPayload = {
        name,
        profile_id: profile.id,
      };

      const job = await client.createJob(jobPayload);
      const res = await client.uploadJobPhoto(
        path.join(__dirname, "test-portrait-1.JPG"),
        job.id
      );

      expect(res.upload_response).to.equal(200);
    });
  });

  // describe("photos", () => {
  //   describe("listPhotos", () => {
  //     it("should return the photos", async () => {
  //       const res = await client.listPhotos();

  //       expect(jobs).to.have.lengthOf.above(0);
  //     });
  //   });
  // });

  // describe("getPhoto", () => {
  //   it("should return the photo", (done) => {
  //     const stub = sinon.stub(restler, "get").returns({
  //       once: sinon.stub().yields({ id: 1 }, {}),
  //     });

  //     client.getPhoto({ id: 1 }, (err, result) => {
  //       assert.equal(result.id, 1);

  //       stub.restore();

  //       done();
  //     });
  //   });
  // });

  // describe("deletePhoto", () => {
  //   it("should return empty object", (done) => {
  //     const stub = sinon.stub(restler, "del").returns({
  //       once: sinon.stub().yields({}, { statusCode: 204 }),
  //     });

  //     client.deletePhoto({ id: 1 }, (err, result) => {
  //       assert.isEmpty(result);

  //       stub.restore();

  //       done();
  //     });
  //   });
  // });
});
