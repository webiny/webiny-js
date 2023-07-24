const encryption = require("./encryption");
const licenses = require("./licenses");
const urls = require("./urls");

const WCP_FEATURE_LABEL = {
    seats: "User Seats",
    multiTenancy: "Multi-tenancy",
    advancedPublishingWorkflow: "Advanced Publishing Workflow (APW)",
    advancedAccessControlLayer: "Advanced Access Control Layer (ACL)"
};

module.exports = { WCP_FEATURE_LABEL, ...encryption, ...licenses, ...urls };
