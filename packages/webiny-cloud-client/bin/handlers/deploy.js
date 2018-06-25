const path = require("path");
const fs = require("fs-extra");
const { Client } = require("./../../src");

export default async argv => {
    // Setup Webiny Cloud Client
    const client = new Client();
    client.init(process.env.WEBINY_ACCESS_TOKEN);

    // Get files digest from the requested folder
    const digest = await client.getFilesDigest(path.resolve(argv.folder));

    // Build fileName => hash map to send to the API
    const files = digest.reduce((files, file) => {
        files[file.rel] = file.hash;
        return files;
    }, {});

    // Create a new Deploy and retrieve a list of required files
    const { id: deployId, required } = await client.createDeploy(files);

    if (required.length) {
        client.log("Required upload of %o file(s)", required.length);
    }

    // Upload each of the required files
    await Promise.all(
        digest.map(async f => {
            if (required.includes(f.rel)) {
                await client.uploadFile(deployId, f.rel, (await fs.readFile(f.abs)).toString());
            }
        })
    );
};
