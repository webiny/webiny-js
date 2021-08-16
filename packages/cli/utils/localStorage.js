// This is a small class that enables us to store some useful
// data into the .webiny folder, located in the project root.
// For example, we are saving the path entered while creating
// GraphQL services, so that the user doesn't have to type
// the same paths over and over.
const fs = require("fs");
const path = require("path");

module.exports = function (filename = "cli.json") {
    const jsonPath = path.join(".webiny", filename);

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
