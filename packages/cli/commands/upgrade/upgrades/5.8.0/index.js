const tsMorph = require('ts-morph');
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
	// check if import already exists
	
	// check if plugin is already in the code
	
	// need to add import to the top of the file
	
	// need to add plugin into the plugins list
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
			 * Configurations or reusable variables
			 */
			const headlessCmsPath = path.resolve(project.root, headlessCMS);
			const graphQLPath = path.resolve(project.root, graphQL);
			const tsConfigFilePath = path.resolve(project.root, "tsconfig.json");
			const headlessCmsIndexFilePath = `${headlessCmsPath}/src/index.ts`;
			const graphQlIndexFilePath = `${graphQLPath}/src/index.ts`;
			/**
			 * Headless CMS API upgrade
			 */
			const headlessCmsProject = new tsMorph.Project();
			/**
			 * Add new package to the package.json file
			 */
			headlessCmsProject.addSourceFileAtPath(headlessCmsIndexFilePath);
			const headlessCmsIndexSourceFile = headlessCmsProject.getSourceFileOrThrow(headlessCmsIndexFilePath);
			const statements = headlessCmsIndexSourceFile.getStatements();
			/**
			 * In the code first we need to find the last import statement and insert new import after that
			 */
			const lastImportStatement = statements.reduce((indexAt, statement, index) => {
				if (statement.getKindName() !== "ImportDeclaration") {
					return indexAt;
				}
				return index;
			}, -1);
			if (lastImportStatement === -1) {
				throw new Error(
					`Could not find last import statement in the Headless CMS file "${headlessCmsIndexFilePath}"`,
				);
			}
			headlessCmsIndexSourceFile.insertStatements(
				lastImportStatement + 1,
				`import headlessCmsDynamoDbElasticStorageOperation from "@webiny/api-headless-cms-ddb-es";`
			);
			
			/**
			 * Next we need to find the createHandler, the plugins property in it and add new plugins
			 */
			for (const statement of statements) {
				if (statement.getKind() !== tsMorph.SyntaxKind.VariableStatement){
					continue;
				}
				const children = statement.getChildren();
				if (children.length !== 3) {
					continue;
				}
				const [,fullHandlerDefinition] = children;
				const handlerVariable = fullHandlerDefinition.getChildAtIndex(1);
				const handlerVariableChildren = handlerVariable.getChildAtIndex(0);
				const createHandlerDefinition = handlerVariableChildren.getChildAtIndex(2);
				const syntaxListParent = createHandlerDefinition.getChildAtIndex(2);
				const syntaxList = syntaxListParent.getChildAtIndex(0);
				const syntaxInnerList = syntaxList.getChildAtIndex(1);
				const pluginsListProperty = syntaxInnerList.getChildAtIndex(0);
				const pluginsListArray = pluginsListProperty.getChildAtIndex(2);
				
				pluginsListArray.addElement("headlessCmsDynamoDbElasticStorageOperation()");
			}
			
			//console.log(headlessCmsIndexSourceFile.getFullText());
			
			await headlessCmsIndexSourceFile.save();
			//console.log(statements.map(statement => statement.getKindName()));
			/*
			console.log(info.hl("Adding @webiny/api-headless-cms-ddb-es package to Headless CMS API."));
			//addPackageToJson(headlessCmsPath);
			//await addPackageToCode(headlessCmsPath);
			console.log();
			
			//console.log(JSON.stringify(Object.keys(jscodeshift.file)));
			console.log(jscodeshift.file.from(`${headlessCmsPath}/src/index.ts`))
			
			// GraphQL API upgrade
			
			console.log(info.hl("Adding @webiny/api-headless-cms-ddb-es package to GraphQL API."));
			//addPackageToJson(graphQLPath);
			//await addPackageToCode(graphQLPath);
			console.log();
			*/
		},
	};
};