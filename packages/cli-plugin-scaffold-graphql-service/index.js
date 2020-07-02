const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const camelCase = require("lodash.camelcase");
const kebabCase = require("lodash.kebabcase");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");
const pluralize = require("pluralize");
const Case = require("case");

// "replace-in-path" module (publish as a standalone NPM package).
// Make sure to add the "preserve-case" feature (same as WebStorm has it)
const globby = require("globby");
const replaceInPath = (path, replacement) => {
    const paths = globby.sync(path);

    const replacements = Array.isArray(replacement) ? replacement : [replacement];

    for (let i = 0; i < paths.length; i++) {
        const currentPath = paths[i];
        let file = fs.readFileSync(currentPath, "utf8");

        for (let j = 0; j < replacements.length; j++) {
            const currentReplacement = replacements[j];
            const findRegex = new RegExp(currentReplacement.find, "g");
            file = file.replace(findRegex, currentReplacement.replaceWith);
        }

        fs.writeFileSync(currentPath, file);
    }
};

module.exports = [
    {
        name: "cli-plugin-scaffold-template-graphql-service",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "GraphQL Apollo Service",
            questions: () => {
                return [
                    {
                        name: "location",
                        message: "Enter package location (including package name)",
                        default: "api/books",
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
                        name: "initialEntityName",
                        message: "Enter the name of the initial model",
                        default: "Book",
                        validate: name => {
                            if (!name.match(/[a-zA-Z]*/)) {
                                return "A valid entity name must consist of letters only.";
                            }

                            return true;
                        }
                    }
                ];
            },
            generate: async ({ input }) => {
                const { location, initialEntityName } = input;
                const fullLocation = path.resolve(location);
                const rootResourcesPath = findUp.sync("resources.js", {
                    cwd: fullLocation
                });

                const projectRootPath = path.dirname(
                    findUp.sync("webiny.root.js", {
                        cwd: fullLocation
                    })
                );

                const relativeLocation = path
                    .relative(path.dirname(rootResourcesPath), fullLocation)
                    .replace(/\\/g, "/");

                const packageName = kebabCase(location);
                const resourceName = camelCase(packageName);
                const serviceName = packageName.replace(/-/g, "_").toUpperCase();

                // Then we also copy the template folder
                const sourceFolder = path.join(__dirname, "template");

                if (fs.existsSync(location)) {
                    throw new Error(`Destination folder ${location} already exists!`);
                }

                await fs.mkdirSync(location, { recursive: true });

                // Get base TS config path
                const baseTsConfigPath = path
                    .relative(
                        fullLocation,
                        findUp.sync("tsconfig.json", {
                            cwd: fullLocation
                        })
                    )
                    .replace(/\\/g, "/");

                // Copy template files
                await ncp(sourceFolder, location);

                // Replace generic Entity with received "input.initialEntityName" argument.
                const entity = {
                    plural: pluralize(Case.camel(initialEntityName)),
                    singular: pluralize.singular(Case.camel(initialEntityName))
                };

                const codeReplacements = [
                    { find: "entities", replaceWith: Case.camel(entity.plural) },
                    { find: "Entities", replaceWith: Case.pascal(entity.plural) },
                    { find: "ENTITIES", replaceWith: Case.constant(entity.plural) },
                    { find: "entity", replaceWith: Case.camel(entity.singular) },
                    { find: "Entity", replaceWith: Case.pascal(entity.singular) },
                    { find: "ENTITY", replaceWith: Case.constant(entity.singular) }
                ];

                replaceInPath(path.join(fullLocation, "src/**/*.ts"), codeReplacements);
                replaceInPath(path.join(fullLocation, "__tests__/**/*.js"), codeReplacements);

                // Make sure to also rename base file names.
                const fileNameReplacements = [
                    {
                        find: "src/plugins/models/entity.model.ts",
                        replaceWith: `src/plugins/models/${entity.singular}.model.ts`
                    },
                    {
                        find: "__tests__/graphql/entities.js",
                        replaceWith: `__tests__/graphql/${entity.plural}.js`
                    }
                ];

                for (let i = 0; i < fileNameReplacements.length; i++) {
                    const fileNameReplacement = fileNameReplacements[i];
                    fs.renameSync(
                        path.join(fullLocation, fileNameReplacement.find),
                        path.join(fullLocation, fileNameReplacement.replaceWith)
                    );
                }

                // Update root package.json - update "workspaces.packages" section.
                const rootPackageJsonPath = path.join(projectRootPath, "package.json");
                const rootPackageJson = await readJson(rootPackageJsonPath);
                if (!rootPackageJson.workspaces.packages.includes(input.location)) {
                    rootPackageJson.workspaces.packages.push(input.location);
                    await writeJson(rootPackageJsonPath, rootPackageJson);
                }

                // Update the package's name
                const packageJsonPath = path.resolve(location, "package.json");
                let packageJson = fs.readFileSync(packageJsonPath, "utf8");
                packageJson = packageJson.replace("[PACKAGE_NAME]", packageName);
                fs.writeFileSync(packageJsonPath, packageJson);

                // Inject resource into closest resources.js
                const { transform } = require("@babel/core");
                const source = fs.readFileSync(rootResourcesPath, "utf8");
                let resourceTpl = fs.readFileSync(path.join(__dirname, "resource.tpl"), "utf8");
                resourceTpl = resourceTpl.replace(/\[PACKAGE_PATH]/g, relativeLocation);

                const { code } = await transform(source, {
                    plugins: [
                        [
                            __dirname + "/transform",
                            {
                                template: resourceTpl,
                                resourceName,
                                serviceName: `LAMBDA_SERVICE_${serviceName}`
                            }
                        ]
                    ]
                });

                // Update tsconfig "extends" path
                const tsConfigPath = path.join(fullLocation, "tsconfig.json");
                const tsconfig = require(tsConfigPath);
                tsconfig.extends = baseTsConfigPath;
                fs.writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));

                // Format code with prettier
                const prettier = require("prettier");
                const prettierConfig = await prettier.resolveConfig(rootResourcesPath);
                const formattedCode = prettier.format(code, { ...prettierConfig, parser: "babel" });

                fs.writeFileSync(rootResourcesPath, formattedCode);
            }
        }
    }
];
