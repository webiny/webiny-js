const fs = require("fs");
const prettier = require("prettier");

const formatCode = async filePath => {
    const options = await prettier.resolveConfig(filePath);
    const fileContentRaw = fs.readFileSync(filePath).toString("utf8");
    const fileContentFormatted = await prettier.format(fileContentRaw, {
        ...options,
        filepath: filePath
    });
    fs.writeFileSync(filePath, fileContentFormatted);
};

module.exports = { formatCode };
