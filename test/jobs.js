const { expect } = require("chai");
const { v4: uuidv4 } = require("uuid");

const skylabStudio = require("../lib/skylabStudio");

const API_KEY = process.env.API_KEY;

describe("Skylab Studio API client", () => {
  let client;

  before(() => {
    client = skylabStudio(API_KEY);
  });

  describe("jobs", () => {
    let testJob;
    describe("createJob", () => {
      it("should return the created job", async () => {
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

        testJob = job;
        expect(job).to.have.property("profileId").to.equal(profile.id);
      });
    });

    describe("listJobs", () => {
      it("should return the jobs", async () => {
        const jobs = await client.listJobs();
        expect(jobs).to.have.lengthOf.above(0);
      });
    });

    describe("getJob", () => {
      it("should return the job", async () => {
        const job = await client.getJob(testJob.id);

        expect(job).to.have.property("id").to.equal(testJob.id);
      });
    });

    describe("updateJob", () => {
      it("should return the updated job", async () => {
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
        const updatedName = uuidv4();
        const updatedJob = await client.updateJob(job.id, {
          name: updatedName,
        });

        expect(updatedJob).to.have.property("name").to.equal(updatedName);
      });
    });

    describe("deleteJob", () => {
      it("should return empty object", async () => {
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

        const res = await client.deleteJob(job.id);

        expect(res).to.have.property("id").to.equal(job.id);
      });
    });

    describe("cancelJob", () => {
      it("should return the canceled job", async () => {
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

        const cancelledJob = await client.cancelJob(job.id);
        expect(cancelledJob).to.have.property("id").to.equal(job.id);
      });
    });
  });
});
