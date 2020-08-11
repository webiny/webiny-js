const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const pluralize = require("pluralize");
const Case = require("case");
const { replaceInPath } = require("replace-in-path");
const { green } = require("chalk");
const indentString = require("indent-string");

module.exports = [
    {
        name: "cli-plugin-scaffold-template-graphql-app",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "Admin App Module",
            questions: () => {
                return [
                    {
                        name: "moduleLocation",
                        message: `Enter module location (including module name)`,
                        default: "apps/admin/src/plugins/books",
                        validate: moduleLocation => {
                            if (!moduleLocation) {
                                return "Please enter the plugins folder location.";
                            }

                            const locationFullPath = path.resolve(moduleLocation);
                            if (fs.existsSync(locationFullPath)) {
                                return `The target location already exists "${moduleLocation}".`;
                            }

                            return true;
                        }
                    },
                    {
                        name: "existingEntityName",
                        message: "Enter name of the initial data model",
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
                const { existingEntityName, moduleLocation, newEntityName } = input;

                const entityName = existingEntityName || newEntityName;

                const fullModuleLocation = path.resolve(moduleLocation);

                // Then we also copy the template folder
                const sourceFolder = path.join(__dirname, "template");

                if (fs.existsSync(fullModuleLocation)) {
                    throw new Error(`Destination folder ${fullModuleLocation} already exists.`);
                }

                await fs.mkdirSync(fullModuleLocation, { recursive: true });

                // Copy template files
                await ncp(sourceFolder, fullModuleLocation);

                // Replace generic "Entity" with received "input.existingEntityName" or "input.newEntityName" argument.
                const entity = {
                    plural: pluralize(Case.camel(entityName)),
                    singular: pluralize.singular(Case.camel(entityName))
                };

                const codeReplacements = [
                    { find: "entities", replaceWith: Case.camel(entity.plural) },
                    { find: "Entities", replaceWith: Case.pascal(entity.plural) },
                    { find: "ENTITIES", replaceWith: Case.constant(entity.plural) },
                    { find: "entity", replaceWith: Case.camel(entity.singular) },
                    { find: "Entity", replaceWith: Case.pascal(entity.singular) },
                    { find: "ENTITY", replaceWith: Case.constant(entity.singular) }
                ];

                replaceInPath(path.join(fullModuleLocation, "**/*.ts"), codeReplacements);
                replaceInPath(path.join(fullModuleLocation, "**/*.tsx"), codeReplacements);

                // Make sure to also rename base file names.
                const fileNameReplacements = [
                    {
                        find: "views/EntitiesDataList.tsx",
                        replaceWith: `views/${Case.pascal(entity.plural)}DataList.tsx`
                    },
                    {
                        find: "views/Entities.tsx",
                        replaceWith: `views/${Case.pascal(entity.plural)}.tsx`
                    },
                    {
                        find: "views/EntityForm.tsx",
                        replaceWith: `views/${Case.pascal(entity.singular)}Form.tsx`
                    }
                ];

                for (const key in fileNameReplacements) {
                    if (!fileNameReplacements.hasOwnProperty(key)) {
                        continue;
                    }
                    const fileNameReplacement = fileNameReplacements[key];
                    fs.renameSync(
                        path.join(fullModuleLocation, fileNameReplacement.find),
                        path.join(fullModuleLocation, fileNameReplacement.replaceWith)
                    );
                }
            },
            onSuccess({ input }) {
                const { moduleLocation } = input;
                const fullModuleLocation = path.resolve(moduleLocation);
                const applicationFilePath = findUp.sync("App.tsx", {
                    cwd: fullModuleLocation
                });

                console.log(
                    "Note: in order to see your new module in the Admin app, you must register the generated plugins:"
                );

                console.log(indentString(`1. Open ${green(applicationFilePath)} file.`, 2));
                console.log(
                    indentString(
                        `2. Import and pass the generated plugins to the app template via the ${green(
                            "plugins"
                        )} array.`,
                        2
                    )
                );

                console.log(
                    "Learn more about app development at https://docs.webiny.com/docs/app-development/introduction."
                );
            }
        }
    }
];
