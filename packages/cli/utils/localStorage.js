// This is a small class that enables us to store some useful
// data into the .webiny folder, located in the project root.
// For example, we are saving the path entered while creating
// GraphQL services, so that the user doesn't have to type
// the same paths over and over.
const fs = require("fs");
const path = require("path");
const getProject = require("./getProject");

module.exports = function (filename = "cli.json") {
    const project = getProject();
    const DOT_WEBINY = path.join(project.root, ".webiny");
    const dataFilePath = path.join(DOT_WEBINY, filename);

    let data = {};
    if (fs.existsSync(dataFilePath)) {
        try {
            data = JSON.parse(fs.readFileSync(dataFilePath));
        } catch {
            throw new Error(
                `Could not parse Webiny CLI's locale storage data file located at ${dataFilePath}.`
            );
        }
    }

    return {
        set(key, value) {
            data[key] = value;

            if (!fs.existsSync(DOT_WEBINY)) {
                fs.mkdirSync(DOT_WEBINY);
            }

            fs.writeFileSync(dataFilePath, JSON.stringify(data));
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
