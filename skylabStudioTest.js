const skylabStudio = require("./lib/skylabStudio");

const client = skylabStudio("16V7LPczUNXb6cdY7V15G5s5");

const logResult = (err, status, result) => {
  console.log("resp", err, status, result);
};

client.listProfiles({}, logResult);
