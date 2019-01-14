# api_js

SkylabTech JavaScript client.

## Installation

```
npm install skylabtech
```

# Usage

All callbacks accept `err` and `response`:

```javascript
var api = require('skylabtech')('API_KEY');

var callback = function(err, response) {
  if (err) {
      console.log(err.statusCode, response);
  } else {
      console.log(response);
  }
};

api.createJob(data, callback);
```

## Jobs

### List all Jobs

```javascript
api.listJobs({}, callback);
```

### Create a Job

```javascript
api.createJob({
  job: {
    profile_id: 123
  }
}, callback);
```

### Get a Job

```javascript
api.getJob({ id: 1 }, callback);
```

### Update a Job

```javascript
api.updateJob({
  id: 1,
  job: {
    profile_id: 456
  }
}, callback);
```

### Delete a Job

```javascript
api.deleteJob({ id: 1 }, callback);
```

### Process a Job

```javascript
api.processJob({ id: 1 }, callback);
```

### Cancel a Job

```javascript
api.cancelJob({ id: 1 }, callback);
```

## Profiles

### List all Profiles

```javascript
api.listProfiles({}, callback);
```

### Create a Profile

```javascript
api.createProfile({
  profile: {
    name: 'My Profile'
  }
}, callback);
```

### Get a Profile

```javascript
api.getProfile({ id: 1 }, callback);
```

### Update a Profile

```javascript
api.updateProfile({
  id: 1,
  job: {
    name: 'Updated Name'
  }
}, callback);
```

### Delete a Profile

```javascript
api.deleteProfile({ id: 1 }, callback);
```

## Photos

### List all Photos

```javascript
api.listPhotos({}, callback);
```

### Create a Photo

```javascript
api.createPhoto({
  profile: {
    name: 'My Photo'
  }
}, callback);
```

### Get a Photo

```javascript
api.getPhoto({ id: 1 }, callback);
```

### Update a Photo

```javascript
api.updatePhoto({
  id: 1,
  job: {
    name: 'Updated Name'
  }
}, callback);
```

### Delete a Photo

```javascript
api.deletePhoto({ id: 1 }, callback);
```

## Troubleshooting

### General Troubleshooting

-   Enable debug mode
-   Make sure you're using the latest Node client
-   Capture the response data and check your logs &mdash; often this will have the exact error

### Enable Debug Mode

Debug mode prints out the underlying request information as well as the data payload that gets sent to Skylab.
You will most likely find this information in your logs. To enable it, simply put `debug=true` as a parameter
when instantiating the API object.

```javascript
var api = require('skylabtech')('API_KEY', debug=true);
```

### Response Ranges

SkylabTech's API typically sends responses back in these ranges:

-   2xx – Successful Request
-   4xx – Failed Request (Client error)
-   5xx – Failed Request (Server error)

If you're receiving an error in the 400 response range follow these steps:

-   Double check the data and ID's getting passed to Skylab
-   Ensure your API key is correct
-   Log and check the body of the response
