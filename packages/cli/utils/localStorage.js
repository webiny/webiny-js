// This is a small class that enables us to store some useful
// data into the .webiny folder, located in the project root.
// For example, we are saving the path entered while creating
// GraphQL services, so that the user doesn't have to type
// the same paths over and over.
const fs = require("fs");
const path = require("path");

const DOT_WEBINY = '.webiny';

module.exports = function (filename = "cli.json") {
    if (!fs.existsSync(DOT_WEBINY)) {
        fs.mkdirSync(DOT_WEBINY);
    }

    const jsonPath = path.join(DOT_WEBINY, filename);
    let data = {};
    if (fs.existsSync(jsonPath)) {
        data = JSON.parse(fs.readFileSync(jsonPath));
    }

    return {
        set(key, value) {
            data[key] = value;
            fs.writeFileSync(jsonPath, JSON.stringify(data));
            return data;
        },
        get(key) {
            if (!key) {
                return data;
            }
            return data[key];
        }
    };
};
