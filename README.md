# Skylab Studio JavaScript Client

[studio.skylabtech.ai](https://studio.skylabtech.ai)

## Installation

```
npm install skylab-studio
```

## Example usage

```javascript
// CREATE PROFILE
const profilePayload = {
  "name": "profile name",
  "enable_crop": false,
  "enable_retouch": true
}

const profile = await api.createProfile(profilePayload)

// CREATE JOB
const jobPayload = {
  "name": "job name",
  "profile_id": profile.id
}

const job = await api.createJob(jobPayload)

// UPLOAD JOB PHOTO(S)
const filePath = "/path/to/photo"
await api.uploadJobPhoto(filePath, job.id)

// QUEUE JOB
payload = { "callback_url" = "YOUR_CALLBACK_ENDPOINT" }
await api.queueJob(job.id, payload)

// NOTE: Once the job is queued, it will get processed then completed
// We will send a response to the specified callback_url with the output photo download urls
```

## Jobs

### List all Jobs

```javascript
await api.listJobs();
```

### Create a Job

```javascript
await api.createJob({
  name: "your job name",
  profile_id: 123,
});
```

For all payload options, consult the [API documentation](https://studio-docs.skylabtech.ai/#tag/job/operation/createJob).

### Get a Job

```javascript
await api.getJob(jobId);
```

### Get Job by Name

```javascript
await api.getJobByName(name);
```

### Update a Job

```javascript
await api.updateJob(jobId, { name: "updated job name", profile_id: 456 });
```

For all payload options, consult the [API documentation](https://studio-docs.skylabtech.ai/#tag/job/operation/updateJobById).

### Queue Job

```javascript
const payload = {
  callback_url: "desired_callback_url",
};

await api.queueJob(jobId, payload);
```

### Jobs in Front

```javascript
await api.getJobsInFront(jobId);
```

### Delete a Job

```javascript
await api.deleteJob(jobId);
```

### Cancel a Job

```javascript
await api.cancelJob(jobId);
```

## Profiles

### List all Profiles

```javascript
await api.listProfiles();
```

### Create a Profile

```javascript
await api.createProfile({
  name: "My Profile",
});
```

For all payload options, consult the [API documentation](https://studio-docs.skylabtech.ai/#tag/profile/operation/createProfile).

### Get a Profile

```javascript
await api.getProfile(profileId);
```

### Update profile

```javascript
payload = {
  name: "My updated profile name",
};

await api.updateProfile(profileId, payload);
```

For all payload options, consult the [API documentation](https://studio-docs.skylabtech.ai/#tag/profile/operation/updateProfileById).

## Photos

### List all Photos

```javascript
await api.listPhotos();
```

#### Upload Job Photo

This function handles validating a photo, creating a photo object and uploading it to your job/profile's s3 bucket. If the bucket upload process fails, it retries 3 times and if failures persist, the photo object is deleted.

```javascript
await api.uploadJobPhoto(photoPath, jobId);
```

`Returns: { photo: { photoObject }, uploadResponse: bucketUploadResponseStatus }`

If upload fails, the photo object is deleted for you. If upload succeeds and you later decide you no longer want to include that image, use delete_photo to remove it.

#### Upload Profile Photo

This function handles validating a background photo for a profile. Note: `enable_extract` and `replace_background` (profile attributes) **MUST** be true in order to create background photos. Follows the same upload process as uploadJobPhoto.

```javascript
await api.uploadProfilePhoto(photoPath, profileId);
```

`Returns: { photo: { photoObject }, uploadResponse: bucketUploadResponseStatus }`

If upload fails, the photo object is deleted for you. If upload succeeds and you later decide you no longer want to include that image, use delete_photo to remove it.

### Get a Photo

```javascript
await api.getPhoto(photoId);
```

### Delete a Photo

```javascript
await api.deletePhoto(photoId);
```

### Validate HMAC Headers

- secretKey: Obtained from Skylab account (contact)
- jobJson: Raw JSON response from callback
- requestTimestamp: Timestamp header received in callback under 'X-Skylab-Timestamp'
- signature: Signature header received in callback under 'X-Skylab-Signature'

**NOTE:** If using something like an express server to handle the callback, the JSON response needs to be the raw response. If your express server is running `app.use(express.json)` you will need to create a middleware and pass it to your callback handler to use the raw response: `app.use(express.raw({ type: "application/json" }))`

```javascript
await api.validateHmacHeaders(secretKey, jobJson, requestTimestamp, signature);
```

## Troubleshooting

### General Troubleshooting

- Enable debug mode
- Make sure you're using the latest Node client
- Capture the response data and check your logs &mdash; often this will have the exact error

### Enable Debug Mode

Debug mode prints out the underlying request information as well as the data payload that gets sent to Skylab.
You will most likely find this information in your logs. To enable it, simply put `debug=true` as a parameter
when instantiating the API object.

```javascript
const skylabStudio = require("skylabStudio");

const api = skylabStudio("your-api-key", (debug = true));
```

### Response Ranges

SkylabTech's API typically sends responses back in these ranges:

- 2xx – Successful Request
- 4xx – Failed Request (Client error)
- 5xx – Failed Request (Server error)

If you're receiving an error in the 400 response range follow these steps:

- Double check the data and ID's getting passed to Skylab
- Ensure your API key is correct
- Log and check the body of the response
