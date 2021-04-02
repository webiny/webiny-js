/**
 * Finds a storage operations package and creates a preset for it.
 * If nothing is sent in the STORAGE_OPERATIONS_FILTER environment variable, all storage operations packages are loaded.
 * If sent, package list is filtered by simple regex.
 */
const path = require("path");
const fs = require("fs");
const getYarnWorkspaces = require("get-yarn-workspaces");

const targetKeywords = ["@webiny/api-headless-cms", "storage-operations"];

const getAllPackages = () => {
	const packages = getYarnWorkspaces(process.cwd())
		.map(pkg => pkg.replace(/\//g, path.sep))
		.filter(pkg => {
			return pkg.match(/\/packages\//) !== null;
		});
	
	const results = packages.map(pkg => {
		const file = path.join(pkg, "package.json");
		if (fs.existsSync(file) === false) {
			return null;
		}
		const content = fs.readFileSync(file).toString();
		try {
			const packageJson = JSON.parse(content);
			if (Array.isArray(packageJson.keywords) === false || packageJson.keywords.length === 0) {
				return null;
			}
			for (const keyword of targetKeywords) {
				if (packageJson.keywords.includes(keyword) === false) {
					return null;
				}
			}
			return {
				path: pkg,
				name: packageJson.name,
				keywords: packageJson.keywords,
				"package.json": packageJson,
			};
		} catch (ex) {
			console.log(`Could not parse "${file}".`);
		}
		return null;
	});
	return results.filter(Boolean);
};

const removeEmptyPreset = (preset) => {
	if (!preset || Object.keys(preset).length === 0) {
		return false;
	}
	return true;
};

const getPackagesPresets = (filter) => {
	const allPackages = getAllPackages();
	const targetPackage = (filter || "").trim();
	const packages = allPackages.filter(pkg => {
		if (!targetPackage) {
			return true;
		}
		for (const keyword of pkg.keywords) {
			if (keyword.match(new RegExp(targetPackage)) !== null) {
				return true;
			}
		}
		return false;
	})
	if (packages.length === 0) {
		throw new Error(
			`There are no storage operations packages.`
		);
	}
	const packagesPresets = [];
	/**
	 * We go through all available packages to build presets for them.
	 */
	for (const pkg of packages) {
		const presetsPath = path.join(pkg.path, "__tests__/presets.js");
		if (!fs.existsSync(presetsPath)) {
			throw new Error(
				`Missing presets.js of the "${pkg.name}" package.`
			);
		}
		/**
		 * We expect presets file to contain an array of presets.
		 */
		const presets = require(presetsPath);
		if (Array.isArray(presets) === false) {
			throw new Error(
				`Presets in package "${pkg.name}" must be defined as an array.`
			);
		}
		/**
		 * Last preset should have test environment defined as it is the environment for the given package.
		 * It overrides previous and default ones.
		 */
		const last = presets[presets.length - 1];
		if (!last.testEnvironment) {
			throw new Error(
				`The last preset in package "${pkg.name}" must have testEnvironment property defined.`
			);
		}
		packagesPresets.push(presets.filter(removeEmptyPreset));
	}
	return packagesPresets;
};

module.exports = (filter) => getPackagesPresets(filter);