const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const kebabCase = require("lodash.kebabcase");
const pluralize = require("pluralize");
const Case = require("case");
const {replaceInPath} = require("replace-in-path");
const fastGlob = require('fast-glob');
const {green} = require("chalk");

const appsPluginsLocation = "apps/admin/src/plugins";

const createPackageLocation = name => {
	return `${appsPluginsLocation}/${name}`;
};

const readApiPackageEntityName = (file) => {
	const fileContent = fs
		.readFileSync(file, {
			encoding: "utf-8",
			flag: "r"
		})
		.toString();
	if(!fileContent) {
		throw new Error(`Could not load any content from file ${file}.`);
	}
	
	const nameMatched = fileContent.match(/withName\("([a-zA-Z]+)"\)/);
	if(!nameMatched) {
		throw new Error(
			`Could not find withName() in ${file} which is needed to detect entity name.`
		);
	}
	return nameMatched[1];
};

const findEntities = (location) => {
	const target = path.resolve(`${location}/**/*.model.ts`);
	const files = fastGlob
		.sync(target, {
			unique: true,
		});
	if(files.length === 0) {
		throw new Error(`Could not find any entities with fast-glob pattern "${target}".`);
	}
	return files.map(file => ({
		fileName: path.basename(file),
		filePath: file,
		entityName: readApiPackageEntityName(file),
	}))
};

module.exports = [
	{
		name: "cli-plugin-scaffold-template-graphql-app",
		type: "cli-plugin-scaffold-template",
		scaffold: {
			name: "GraphQL Apollo Service App",
			questions: () => {
				return [
					{
						name: "apiLocation",
						message: "Enter existing GraphQL API location (relative to the project root) or empty for none",
						validate: apiLocation => {
							if(!apiLocation) {
								return true;
							}
							if(fs.existsSync(apiLocation) === false) {
								return "There is no GraphQL API in given location.";
							}
							try {
								findEntities(apiLocation);
							}
							catch (ex) {
								return `Could not find existing API entity in "${apiLocation}".`;
							}
							return true;
						}
					},
					{
						name: "existingEntityName",
						message: "Choose entity to use",
						type: "list",
						when: ({apiLocation}) => {
							return !!apiLocation;
						},
						choices: ({apiLocation}) => {
							const names = findEntities(apiLocation);
							return names.map(({entityName}) => entityName);
						},
						validate: (name, {apiLocation}) => {
							if(!name) {
								return "Please enter a entity name.";
							}
							else if(!name.match(/^([a-z]+)$/i)) {
								return "A valid entity name must consist of letters only.";
							}
							try {
								const names = findEntities(apiLocation).map(({entityName}) => entityName);
								if(!names.includes(name)) {
									throw new Error();
								}
								return true;
							}
							catch (ex) {
								return `A entity with name "${name}" does not exist.`;
							}
						}
					},
					{
						name: "packageLocation",
						message: `Enter package location (will be located in "${appsPluginsLocation}" directory)`,
						default: "books",
						validate: name => {
							if(!name) {
								return "Please enter a package location.";
							}
							const packageLocation = createPackageLocation(name);
							
							const locationFullPath = path.resolve(packageLocation);
							if(fs.existsSync(locationFullPath)) {
								return `The target location already exists "${packageLocation}".`;
							}
							
							const rootResourcesPath = findUp.sync("resources.js", {
								cwd: locationFullPath
							});
							
							if(!rootResourcesPath) {
								return `Resources file was not found. Make sure your package is inside of your project's root and that either it or one of its parent directories contains resources.js`;
							}
							
							return true;
						}
					},
					{
						name: "newEntityName",
						message: "Enter name of the entity",
						default: "Book",
						when: ({existingEntityName}) => {
							return !existingEntityName;
						},
						validate: (name) => {
							if(!name.match(/^([a-z]+)$/i)) {
								return "A valid entity name must consist of letters only.";
							}
							return true;
						}
					}
				];
			},
			generate: async ({input, oraSpinner}) => {
				const {existingEntityName, packageLocation, newEntityName} = input;
				
				const entityName = existingEntityName || newEntityName;
				
				const fullPackageLocation = path.resolve(createPackageLocation(packageLocation));
				const applicationFilePath = findUp.sync('App.tsx', {
					cwd: fullPackageLocation,
				});
				
				const packageName = kebabCase(packageLocation);
				
				// Then we also copy the template folder
				const sourceFolder = path.join(__dirname, "template");
				
				if(fs.existsSync(fullPackageLocation)) {
					throw new Error(`Destination folder ${fullPackageLocation} already exists.`);
				}
				
				await fs.mkdirSync(fullPackageLocation, {recursive: true});
				
				// Get base TS config path
				const baseTsConfigPath = path
					.relative(
						fullPackageLocation,
						findUp.sync("tsconfig.json", {
							cwd: fullPackageLocation
						})
					)
					.replace(/\\/g, "/");
				
				// Copy template files
				await ncp(sourceFolder, fullPackageLocation);
				
				// Replace generic "Entity" with received "input.existingEntityName" or "input.newEntityName" argument.
				const entity = {
					plural: pluralize(Case.camel(entityName)),
					singular: pluralize.singular(Case.camel(entityName))
				};
				
				const codeReplacements = [
					{find: "entities", replaceWith: Case.camel(entity.plural)},
					{find: "Entities", replaceWith: Case.pascal(entity.plural)},
					{find: "ENTITIES", replaceWith: Case.constant(entity.plural)},
					{find: "entity", replaceWith: Case.camel(entity.singular)},
					{find: "Entity", replaceWith: Case.pascal(entity.singular)},
					{find: "ENTITY", replaceWith: Case.constant(entity.singular)}
				];
				
				replaceInPath(path.join(fullPackageLocation, "**/*.ts"), codeReplacements);
				replaceInPath(path.join(fullPackageLocation, "**/*.tsx"), codeReplacements);
				
				// Make sure to also rename base file names.
				const fileNameReplacements = [
					{
						find: "views/EntitiesDataList.tsx",
						replaceWith: `views/${Case.pascal(entity.plural)}DataList.tsx`,
					},
					{
						find: "views/Entities.tsx",
						replaceWith: `views/${Case.pascal(entity.plural)}.tsx`,
					},
					{
						find: "views/EntityForm.tsx",
						replaceWith: `views/${Case.pascal(entity.singular)}Form.tsx`,
					},
					{
						find: "example.tsconfig.json",
						replaceWith: "tsconfig.json"
					}
				];
				
				for (const key in fileNameReplacements) {
					if(!fileNameReplacements.hasOwnProperty(key)) {
						continue;
					}
					const fileNameReplacement = fileNameReplacements[key];
					fs.renameSync(
						path.join(fullPackageLocation, fileNameReplacement.find),
						path.join(fullPackageLocation, fileNameReplacement.replaceWith)
					);
				}
				
				// Update the package's name
				const packageJsonPath = path.resolve(fullPackageLocation, "package.json");
				let packageJson = fs.readFileSync(packageJsonPath, "utf8");
				packageJson = packageJson.replace(/\[PACKAGE_NAME\]/g, packageName);
				fs.writeFileSync(packageJsonPath, packageJson);
				
				// Update tsconfig "extends" path
				const tsConfigPath = path.join(fullPackageLocation, "tsconfig.json");
				const tsconfig = require(tsConfigPath);
				tsconfig.extends = baseTsConfigPath;
				fs.writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));
				
				const appPath = applicationFilePath || 'app tsx file';
				
				oraSpinner.info('You must register the generated plugins in order for them to appear in your app.');
				oraSpinner.info(`Open your ${green(appPath)} and pass your new plugins to the app template via the "plugins" option.`);
				oraSpinner.info('Learn more about Webiny app development at https://docs.webiny.com/docs/app-development/introduction.')
			}
		}
	}
];
