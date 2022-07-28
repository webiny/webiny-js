const fs = require("fs");
const path = require("path");

// This function has been created in order to help preserve backwards compatibility
// (from 5.29.0, the `api` app has been moved into the `apps/api` directory).
module.exports = project => {
    if (fs.existsSync(path.join(project.root, "api"))) {
        return "api";
    }

    return "apps/api";
};
