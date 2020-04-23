"use strict";

process.on("unhandledRejection", err => {
	throw err;
});

const chalk = require("chalk");
const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

module.exports = function(root, appName, templateName) {
	const appPackage = require(path.join(root, "package.json"));

	if(!templateName) {
		console.log("Please provide a template.");
		return;
	}

	const templatePath = path.dirname(
		require.resolve(`${templateName}/package.json`, { paths: [root] })
	);

	let templateJson = {};
	const templateJsonPath = path.join(templatePath, "package.json");

	if (fs.existsSync(templateJsonPath)) {
		templateJson = require(templateJsonPath);
	}

	// Keys to ignore in templatePackage
	const templatePackageBlacklist = [
		"name",
		"version",
		"description",
		"keywords",
		"bugs",
		"license",
		"author",
		"contributors",
		"files",
		"browser",
		"bin",
		"man",
		"directories",
		"repository",
		"bundledDependencies",
		"optionalDependencies",
		"engineStrict",
		"os",
		"cpu",
		"preferGlobal",
		"private",
		"publishConfig",
	];

	const templatePackageToReplace = Object.keys(templateJson).filter(key => {
		return !templatePackageBlacklist.includes(key);
	});

	// Add templatePackage keys/values to appPackage, replacing existing entries
	templatePackageToReplace.forEach(key => {
		appPackage[key] = templateJson[key];
	});

	fs.writeFileSync(
		path.join(root, "package.json"),
		JSON.stringify(appPackage, null, 2) + os.EOL
	);

	// Copy the files for the user
	const templateDir = path.join(templatePath, "template");
	if (fs.existsSync(templateDir)) {
		fs.copySync(templateDir, root);
	} else {
		console.error(`Could not locate supplied template: ${chalk.green(templateDir)}`);
		return;
	}

	//.env.json
	const templateEnvExists = fs.existsSync(path.join(root, '.env.json'));
	if(!templateEnvExists) {
		fs.moveSync(
			path.join(root, 'example.env.json'),
			path.join(root, '.env.json'),
			[]
		);
	}

	//api/.env.json
	const apiEnvExists = fs.existsSync(path.join(root, 'api','.env.json'));
	if(!apiEnvExists) {
		fs.moveSync(
			path.join(root, 'api', 'example.env.json'),
			path.join(root, 'api', '.env.json'),
			[]
		);
	}

	//apps/admin/.env.json
	const appAdminEnvExists = fs.existsSync(path.join(root, 'apps','admin','.env.json'));
	if(!appAdminEnvExists) {
		fs.moveSync(
			path.join(root, 'apps','admin', 'example.env.json'),
			path.join(root, 'apps','admin', '.env.json'),
			[]
		);
	}

	//apps/site/.env.json
	const appSiteEnvExists = fs.existsSync(path.join(root, 'apps','site','.env.json'));
	if(!appSiteEnvExists) {
		fs.moveSync(
			path.join(root, 'apps','site', 'example.env.json'),
			path.join(root, 'apps','site', '.env.json'),
			[]
		);
	}

	//.babel.node.js
	const babelNodeExists = fs.existsSync(path.join(root, '.babel.node.js'));
	if(!babelNodeExists) {
		fs.moveSync(
			path.join(root, 'example.babel.node.js'),
			path.join(root, '.babel.node.js'),
			[]
		);
	}

	//.babel.react.js
	const babelReactExists = fs.existsSync(path.join(root, '.babel.react.js'));
	if(!babelReactExists) {
		fs.moveSync(
			path.join(root, 'example.babel.react.js'),
			path.join(root, '.babel.react.js'),
			[]
		);
	}

	//.prettierrc.js
	const prettierrcExists = fs.existsSync(path.join(root, '.prettierrc.js'));
	if(!prettierrcExists) {
		fs.moveSync(
			path.join(root, 'example.prettierrc.js'),
			path.join(root, '.prettierrc.js'),
			[]
		);
	}

	//initialize git repo
	try {
		execa.sync("git",  ["--version"]);
		execa.sync("git", ["init"]);
		console.log("\nInitialized a git repository.");
		fs.writeFileSync(path.join(root, ".gitignore"), "node_modules/");
	} catch(err) {
		console.warn("Git repo not initialized", err);
	}

	//Install dependencies for admin as well as site
	try {
		console.log('installing dependencies');
		execa.sync("yarn", {
			cwd: root,
			stdio: "inherit",
		});
	} catch (err) {
		console.log(err);
	}

	// Remove template from dependencies
	try {
        execa.sync("rm", ["-r", "node_modules/" + templateName], {
			cwd: root
        });
	} catch (err) {
        console.log(err);
		console.error("Unable to remove " + templateName);
	}

	console.log(`Success! Created ${appName} at ${root}`);
	console.log("Inside that directory, you can run several commands:\n");
	console.log("You can begin by typing:\n");
	console.log(chalk.cyan("  cd"), appName);
	console.log("Happy hacking!");
};