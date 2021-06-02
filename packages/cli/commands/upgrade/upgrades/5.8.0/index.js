const jsCodeShiftRunner = require('jscodeshift/src/Runner');
const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");


const addPackageToJson = (targetPath) => {
	const file = `${targetPath}/package.json`;
	const json = loadJson.sync(file);
	if (!json) {
		throw new Error(
			`There is no package.json file "${file}"`
		);
	} else if (!json.dependencies) {
		throw new Error(
			`There is no dependencies property in package.json "${file}"`,
		);
	}
	json.dependencies["@webiny/api-headless-cms-ddb-es"] = "^5.8.0";
	
	writeJson.sync(file, json);
};

const addPackageToCode = (targetPath) => {
	const file = `${targetPath}/src/index.ts`;
	const content = jscodeshift.file.from(file);
	// need to add import to the top of the file
	
	// need to add package into the packages
};

const headlessCMS = "api/code/headlessCMS";
const graphQL = "api/code/graphql";

module.exports = () => {

	return {
		name: "upgrade-5.8.0",
		type: "cli-upgrade",
		version: "5.8.0",
		canUpgrade() {
			return true;
		},
		async upgrade(options, context) {
			const {info, project} = context;
			/**
			 * Headless CMS API upgrade
			 */
			const headlessCmsPath = path.resolve(project.root, headlessCMS);
			console.log(info.hl("Adding @webiny/api-headless-cms-ddb-es package to Headless CMS API."));
			//addPackageToJson(headlessCmsPath);
			//await addPackageToCode(headlessCmsPath);
			console.log();
			
			//console.log(JSON.stringify(Object.keys(jscodeshift.file)));
			console.log(jscodeshift.file.from(`${headlessCmsPath}/src/index.ts`))
			
			/**
			 * GraphQL API upgrade
			 */
			const graphQLPath = path.resolve(project.root, graphQL);
			console.log(info.hl("Adding @webiny/api-headless-cms-ddb-es package to GraphQL API."));
			//addPackageToJson(graphQLPath);
			//await addPackageToCode(graphQLPath);
			console.log();
		},
	};
};