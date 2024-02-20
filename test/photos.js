const { expect } = require("chai");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const skylabStudio = require("../lib/skylabStudio");
const API_KEY = process.env.API_KEY;

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

  describe("getPhoto", () => {
    it("should return the photo", async () => {
      const payload = {
        name: uuidv4(),
        enable_crop: false,
      };

      const profile = await client.createProfile(payload);

      const jobPayload = {
        name: uuidv4(),
        profile_id: profile.id,
      };

      const job = await client.createJob(jobPayload);
      const photo = await client.createPhoto({
        name: uuidv4(),
        job_id: job.id,
      });

      const res = await client.getPhoto(photo.id);
      expect(res).to.have.property("id").to.equal(photo.id);
    });
  });

  describe("deletePhoto", () => {
    it("should return the deleted photo", async () => {
      const payload = {
        name: uuidv4(),
        enable_crop: false,
      };

      const profile = await client.createProfile(payload);

      const jobPayload = {
        name: uuidv4(),
        profile_id: profile.id,
      };

      const job = await client.createJob(jobPayload);

      const photo = await client.createPhoto({
        name: uuidv4(),
        job_id: job.id,
      });

      const res = await client.deletePhoto(photo.id);
      expect(res).to.have.property("id").to.equal(photo.id);
    });
  });
});
