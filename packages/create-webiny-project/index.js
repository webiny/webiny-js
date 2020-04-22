#!/usr/bin/env node
const chalk = require("chalk");
const envinfo = require("envinfo");
const fs = require("fs-extra");
const hyperquest = require("hyperquest");
const os = require("os");
const path = require("path");
const execa = require("execa");
const tmp = require("tmp");
const unpack = require("tar-pack").unpack;
const yargs = require("yargs");
const validateProjectName = require("validate-npm-package-name");

const packageJson = require("./package.json");
const init = require("./init.js");

yargs
	.usage("Usage: $0 <project-name> [options]")
	.version(packageJson.version)
	.demandCommand(1)
	.example("$0 helloWorld --template=basic")
	.help()
	.alias("help", "h")
	.fail(function(msg, err) {
		if (msg) console.log(msg);
		if (err) console.log(err);
		process.exit(1);      
	});

yargs.command(
	"$0 <project-name>",
	"Name of application and template to use",
	yargs => {
		yargs.positional("project-name", {
			describe: "Project name"
		});
		yargs.option("template", {
			describe: "Name of template to use",
			alias: "t",
			type: "string",
			demandOption: true,
		});
	},
	(argv) => createApp(argv.projectName, argv.template))
	.argv;

yargs.command(
	"info",
	"Print environment debug information",
	{},
	() => informationHandler())
	.argv;

function checkAppName(appName) {
	const validationResult = validateProjectName(appName);
	if (!validationResult.validForNewPackages) {
		console.error(
			chalk.red(
				`Cannot create a project named ${chalk.green(
					`"${appName}"`
				)} because of npm naming restrictions:\n`
			)
		);
		[
			...(validationResult.errors || []),
			...(validationResult.warnings || []),
		].forEach(error => {
			console.error(chalk.red(`  * ${error}`));
		});
		console.error(chalk.red("\nPlease choose a different project name."));
		process.exit(1);
	}
}

function createApp(projectName, template) {
	if(!projectName) {
		console.log("You must provide a name for the project to use.");
	} else {
		if(template === "basic") {
			const root = path.resolve(projectName);
			const appName = path.basename(root);

			//Make sure the name provided is following npm package nomenclature
			checkAppName(appName);
			fs.ensureDirSync(projectName);

			console.log(`\nCreating your Webiny app in ${chalk.green(root)}.\n`);

			const packageJson = {
				name: appName,
				version: "0.1.0",
				private: true,
			};
			//prettifies the package.json
			fs.writeFileSync(
				path.join(root, "package.json"),
				JSON.stringify(packageJson, null, 2) + os.EOL
			);

			run(root, appName, template);
		} else {
			console.log("Invalid template name, we currently support 'basic'.");
		}
	}
}

function extractStream(stream, dest) {
	return new Promise((resolve, reject) => {
		stream.pipe(
			unpack(dest, err => {
				if (err) {
					reject(err);
				} else {
					resolve(dest);
				}
			})
		);
	});
}

async function getPackageInfo(installPackage) {
	if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
		try {
			const obj = await getTemporaryDirectory();
			let stream;
			if (/^http/.test(installPackage)) {
				stream = hyperquest(installPackage);
			} else {
				stream = fs.createReadStream(installPackage);
			}
			await extractStream(stream, obj.tmpdir);

			const { name, version } = require(path.join(obj.tmpdir, "package.json"));
			obj.cleanup();
			return { name, version };
		} catch (err) {
			console.log(
				`Could not extract the package name from the archive: ${err.message}`
			);
			const assumedProjectName = installPackage.match(
				/^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/
			)[1];
			console.log(
				`Based on the filename, assuming it is "${chalk.cyan(
					assumedProjectName
				)}"`
			);
			return { name: assumedProjectName };
		}
	} else if (installPackage.startsWith("git+")) {
		// Pull package name out of git urls e.g:
		// git+https://github.com/mycompany/package.git
		// git+ssh://github.com/mycompany/package.git#v1.2.3
		const packageNameGit = await installPackage.match(/([^/]+)\.git(#.*)?$/)[1];
		return { name: packageNameGit };
	} else if (installPackage.match(/.+@/)) {
		// Do not match @scope/ when stripping off @version or @tag
		return {
			name: installPackage.charAt(0) + installPackage.substr(1).split("@")[0],
			version: installPackage.split("@")[1]
		};
	} else if (installPackage.match(/^file:/)) {
		const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
		const { name, version } = require(path.join(
			installPackagePath,
			"package.json"
		));
		return { name, version };
	}
	return { name: installPackage };
}

async function getTemporaryDirectory() {
	try {
		const { tmpdir, callback } = await tmp.dir({ unsafeCleanup: true });
		console.log(callback);
		return { tmpdir, cleanup: () => callback() };
	} catch (err) {
		return err;
	}
}

function informationHandler() {
	console.log(chalk.bold("\nEnvironment Info:"));
	console.log(
		`\n  current version of ${packageJson.name}: ${packageJson.version}`
	);
	console.log(`  running from ${__dirname}`);
	return envinfo
		.run(
			{
				System: ["OS", "CPU"],
				Binaries: ["Node", "npm", "Yarn"],
				Browsers: ["Chrome", "Edge", "Internet Explorer", "Firefox", "Safari"],
				npmGlobalPackages: ["create-webiny-project"],
			},
			{
				duplicates: true,
				showNotFound: true,
			}
		)
		.then(console.log);    
}

async function install(root, dependencies) {
	const command = "yarnpkg";
	const args = ["add", "--exact"];
  	[].push.apply(args, dependencies);
	args.push("--cwd");
	args.push(root);
	await execa(command, args, { stdio: "inherit" });
	return;
}

async function run(root, appName, template) {
	const allDependencies = [];
	try {
		console.log("Installing packages. This might take a couple of minutes.");

		// const templateInfo = await getPackageInfo("cwp-template-" + template);
		const templateName = "cwp-template-" + template;

		allDependencies.push(templateName);

		await install(root, allDependencies);

		await init(root, appName, templateName);
	} catch(reason) {
		console.log("\nAborting installation.");
		if (reason.command) {
			console.log(`  ${chalk.cyan(reason.command)} has failed.`);
		} else {
			console.log(chalk.red("Unexpected error. Please report it as a bug:"));
			console.log(reason);
		}
		console.log("\nDone.");
		process.exit(1);
	}
}