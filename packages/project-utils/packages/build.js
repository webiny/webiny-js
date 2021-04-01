const execa = require("execa");
const fs = require("fs");

module.exports = async () => {
    console.log("Deleting existing build files...");
    execa.sync("yarn", ["rimraf", `./dist`, `"*.tsbuildinfo"`], {
        stdio: "inherit"
    });

    console.log("Building...");
    execa.sync(
        "yarn",
        ["babel", "src", "-d", "dist", "--source-maps", "--copy-files", "--extensions", ".ts,.tsx"],
        {
            stdio: "inherit"
        }
    );

    console.log("Generating TypeScript types...");
    execa.sync("yarn", ["tsc", "-p", "tsconfig.build.json"]);

    console.log("Copying meta files...");
    fs.copyFileSync("package.json", "./dist/package.json");
    fs.copyFileSync("LICENSE", "./dist/LICENSE");
    fs.copyFileSync("README.md", "./dist/README.md");
    console.log("Done.");
};
