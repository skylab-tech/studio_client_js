const { expect } = require("chai");
const { v4: uuidv4 } = require("uuid");

const skylabStudio = require("../lib/skylabStudio");

const API_KEY = process.env.API_KEY;

describe("Skylab Studio API client", () => {
  let client;

  before(() => {
    client = skylabStudio(API_KEY);
  });

  describe("createProfile", () => {
    it("should return the created profile", async () => {
      const name = uuidv4();
      const payload = {
        name,
        enable_crop: false,
      };

      const profile = await client.createProfile(payload);

      expect(profile.name).to.equal(name);
    });
  });

  describe("listProfiles", () => {
    it("should return the profiles", async () => {
      const res = await client.listProfiles();
      expect(res).to.have.lengthOf.above(0);
    });
  });

  describe("getProfile", () => {
    it("should return the profile", async () => {
      const profilePayload = {
        name: uuidv4(),
        enable_crop: false,
      };
      const profile = await client.createProfile(profilePayload);
      const res = await client.getProfile(profile.id);

      expect(res).to.have.property("id").to.equal(profile.id);
    });
  });

  describe("updateProfile", () => {
    it("should return the updated profile", async () => {
      const profilePayload = {
        name: uuidv4(),
        enable_crop: false,
      };
      const profile = await client.createProfile(profilePayload);

      const updatedName = uuidv4();
      const updatedProfilePayload = {
        name: updatedName,
      };
      const updatedProfile = await client.updateProfile(
        profile.id,
        updatedProfilePayload
      );
      expect(updatedProfile).to.have.property("name").to.equal(updatedName);
    });
  });
});
