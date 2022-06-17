const fs = require("fs");
const path = require("path");

module.exports = project => {
    if (fs.existsSync(path.join(project.root, "api"))) {
        return "api";
    }

    return "apps/api";
};
