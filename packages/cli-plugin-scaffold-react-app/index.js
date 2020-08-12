const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const camelCase = require("lodash.camelcase");
const kebabCase = require("lodash.kebabcase");

const appTypes = {
    custom: "Custom App",
    admin: "Admin App",
    site: "Site App"
};
const appTypesArray = Object.values(appTypes);

module.exports = [
    {
        name: "cli-plugin-scaffold-template-react-app",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "React Application",
            questions: () => {
                return [
                    {
                        name: "location",
                        message: "Enter package location (including package name)",
                        default: 'apps/my-app',
                        validate: location => {
                            if (location === "") {
                                return "Please enter a package location";
                            }

                            if (fs.existsSync(path.resolve(location))) {
                                return "The target location already exists";
                            }

                            const rootResourcesPath = findUp.sync("resources.js", {
                                cwd: path.resolve(location)
                            });
                            if (!rootResourcesPath) {
                                return `Resources file was not found. Make sure your package is inside of your project's root and that either it or one of its parent directories contains resources.js`;
                            }

                            return true;
                        }
                    },
                    {
                        name: "type",
                        message: "Select application template type:",
                        type: "list",
                        choices: appTypesArray
                    }
                ];
            },
            generate: async ({ input }) => {
                const { type: appType, location } = input;
                const fullLocation = path.resolve(location);
                const rootResourcesPath = findUp.sync("resources.js", {
                    cwd: fullLocation
                });

                const relativeLocation = path
                    .relative(path.dirname(rootResourcesPath), fullLocation)
                    .replace(/\\/g, "/");

                const packageName = kebabCase(location);
                const resourceName = camelCase(packageName);

                // Get base TS config path
                const baseTsConfigPath = path
                    .relative(
                        fullLocation,
                        findUp.sync("tsconfig.json", {
                            cwd: fullLocation
                        })
                    )
                    .replace(/\\/g, "/");

                const appTypeToTemplateFolder = {
                    [appTypes.custom]: "template-custom",
                    [appTypes.admin]: "template-admin",
                    [appTypes.site]: "template-site"
                };
                const templateFolder = appTypeToTemplateFolder[appType];

                // Then we also copy the template folder
                const sourceFolder = path.join(__dirname, templateFolder);

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

                // Update PUBLIC_URL in .env.json with the correct resource name
                const envJsonPath = path.resolve(location, ".env.json");
                let envJson = fs.readFileSync(envJsonPath, "utf8");
                envJson = envJson.replace("[RESOURCE_NAME]", resourceName);
                fs.writeFileSync(envJsonPath, envJson);

                // Compute "exclude" and "reference" paths if possible
                const webinyProjectPath = path.dirname(baseTsConfigPath);
                let excludeField, referencesField;
                if ([appTypes.admin, appTypes.site].includes(appType)) {
                    let appTemplatePackage; // "app-template-admin" or "app-template-site"
                    if (appType === appTypes.admin) {
                        appTemplatePackage = "app-template-admin";
                    } else if (appType === appTypes.site) {
                        appTemplatePackage = "app-template-site";
                    }

                    const excludePath = path
                        .join(webinyProjectPath, `packages/${appTemplatePackage}`)
                        .replace(/\\/g, "/");
                    const referencesPath = path
                        .join(
                            webinyProjectPath,
                            `packages/${appTemplatePackage}/tsconfig.build.json`
                        )
                        .replace(/\\/g, "/");

                    excludeField = [excludePath];
                    referencesField = [{ path: referencesPath }];
                }

                // Update tsconfig "extends", "exclude" and "references" paths
                const tsConfigPath = path.join(fullLocation, "tsconfig.json");
                const tsconfig = require(tsConfigPath);
                tsconfig.extends = baseTsConfigPath;
                tsconfig.exclude = excludeField || tsconfig.exclude;
                tsconfig.references = referencesField || tsconfig.references;
                fs.writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));

                // Inject resource into closest resources.js //
                const { transform } = require("@babel/core");
                const source = fs.readFileSync(rootResourcesPath, "utf8");
                let resourceTpl = fs.readFileSync(path.join(__dirname, "resource.tpl"), "utf8");
                resourceTpl = resourceTpl.replace(/\[PACKAGE_PATH]/g, relativeLocation);

                const { code } = await transform(source, {
                    plugins: [
                        [__dirname + "/transform", { resourceTemplate: resourceTpl, resourceName }]
                    ]
                });

                // Format code with prettier
                const prettier = require("prettier");
                const prettierConfig = await prettier.resolveConfig(rootResourcesPath);
                const formattedCode = prettier.format(code, { ...prettierConfig, parser: "babel" });

                fs.writeFileSync(rootResourcesPath, formattedCode);
            }
        }
    }
];
