const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const camelCase = require("lodash.camelcase");

module.exports = [
    {
        name: "scaffold-template-graphql-service",
        type: "scaffold-template",
        scaffold: {
            name: "GraphQL Apollo Service",
            questions: () => {
                return [
                    {
                        name: "location",
                        message: "Enter package location (including package name)",
                        validate: location => {
                            if (location === "") {
                                return "Please enter a package location";
                            }

                            if (fs.existsSync(path.resolve(location)))
                                return "The target location already exists";

                            return true;
                        }
                    }
                ];
            },
            generate: async ({ input }) => {
                const { location } = input;
                const rootResourcesPath = findUp.sync("resources.js", {
                    cwd: path.resolve(location)
                });

                const relativeLocation = path
                    .relative(path.dirname(rootResourcesPath), path.resolve(location))
                    .replace(/\\/g, "/");

                const packageName = path.basename(location);
                const resourceName = camelCase(packageName);

                // Then we also copy the template folder
                const sourceFolder = path.join(__dirname, "template");

                if (fs.existsSync(location)) {
                    throw new Error(`Package ${packageName} already exists!`);
                }

                await fs.mkdirSync(location, { recursive: true });
                await ncp(sourceFolder, location);

                // Update the package's name
                const packageJsonPath = path.resolve(location, "package.json");
                let packageJson = fs.readFileSync(packageJsonPath, "utf8");
                packageJson = packageJson.replace("[PACKAGE_NAME]", packageName);
                fs.writeFileSync(packageJsonPath, packageJson);

                // Inject resource into closest resources.js
                const { transform } = require("@babel/core");
                const source = fs.readFileSync(rootResourcesPath, "utf8");
                let resourceTpl = fs.readFileSync(path.join(__dirname, "resource.tpl"), "utf8");
                resourceTpl = resourceTpl.replace(/\[PACKAGE_PATH\]/g, relativeLocation);

                const { code } = await transform(source, {
                    plugins: [[__dirname + "/transform", { template: resourceTpl, resourceName }]]
                });

                // TODO: update path to tsconfig.build.json

                // Format code with prettier
                const prettier = require("prettier");
                const prettierConfig = await prettier.resolveConfig(rootResourcesPath);
                const formattedCode = prettier.format(code, prettierConfig);

                fs.writeFileSync(rootResourcesPath, formattedCode);
            }
        }
    }
];
