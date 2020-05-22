#!/usr/bin/env node
const path = require("path");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");
const getPackages = require("get-yarn-workspaces");
const { red, blue, cyan } = require("chalk");
const argv = require("yargs").argv;

/**
 * This is a small tool that updates the versions of all @webiny packages across the sample project.
 * Useful for example when new @next versions are released, and when those need to be tested
 * with packages in this repo.
 *
 * Usage:
 * - yarn webiny-versions --preview
 * - yarn webiny-versions
 */

const WEBINY_PACKAGES = [
    "@webiny/api",
    "@webiny/api-cookie-policy",
    "@webiny/api-files",
    "@webiny/api-form-builder",
    "@webiny/api-google-tag-manager",
    "@webiny/api-headless-cms",
    "@webiny/api-i18n",
    "@webiny/api-mailchimp",
    "@webiny/api-page-builder",
    "@webiny/handler",
    "@webiny/api-plugin-commodo-db-proxy",
    "@webiny/api-plugin-commodo-mongodb",
    "@webiny/api-plugin-create-apollo-gateway",
    "@webiny/api-plugin-create-apollo-handler",
    "@webiny/api-plugin-files-resolvers-mongodb",
    "@webiny/api-plugin-security-cognito",
    "@webiny/api-security",
    "@webiny/app",
    "@webiny/app-admin",
    "@webiny/app-cookie-policy",
    "@webiny/app-form-builder",
    "@webiny/app-form-builder-theme",
    "@webiny/app-plugin-security-cognito",
    "@webiny/app-plugin-security-cognito-theme",
    "@webiny/app-security",
    "@webiny/app-template",
    "@webiny/app-template-admin",
    "@webiny/app-template-admin-full",
    "@webiny/app-template-site",
    "@webiny/app-typeform",
    "@webiny/cli",
    "@webiny/cli-plugin-deploy-components",
    "@webiny/cli-plugin-scaffold",
    "@webiny/cli-plugin-scaffold-graphql-service",
    "@webiny/cli-plugin-scaffold-lambda",
    "@webiny/cli-scaffold-custom-lambda",
    "@webiny/cli-scaffold-graphql-service",
    "@webiny/commodo",
    "@webiny/commodo-fields-storage-db-proxy",
    "@webiny/commodo-graphql",
    "@webiny/create-webiny-project",
    "@webiny/cwp-template-cms",
    "@webiny/cwp-template-full",
    "@webiny/form",
    "@webiny/graphql",
    "@webiny/handler",
    "@webiny/handler-apollo-gateway",
    "@webiny/handler-apollo-server",
    "@webiny/handler-files",
    "@webiny/handler-index",
    "@webiny/handler-ssr",
    "@webiny/http-handler",
    "@webiny/http-handler-apollo-gateway",
    "@webiny/http-handler-apollo-server",
    "@webiny/http-handler-files",
    "@webiny/http-handler-index",
    "@webiny/http-handler-ssr",
    "@webiny/i18n",
    "@webiny/i18n-react",
    "@webiny/plugins",
    "@webiny/project-utils",
    "@webiny/react-router",
    "@webiny/serverless-api-gateway",
    "@webiny/serverless-apollo-service",
    "@webiny/serverless-app",
    "@webiny/serverless-aws-api-gateway",
    "@webiny/serverless-aws-cloudfront",
    "@webiny/serverless-aws-cognito-user-pool",
    "@webiny/serverless-aws-lambda",
    "@webiny/serverless-aws-s3",
    "@webiny/serverless-aws-s3-object",
    "@webiny/serverless-component",
    "@webiny/serverless-db-proxy",
    "@webiny/serverless-files",
    "@webiny/serverless-function",
    "@webiny/storybook-utils",
    "@webiny/tracking",
    "@webiny/ui",
    "@webiny/validation"
];

const PREVIEW = argv.preview;

(async () => {
    if (PREVIEW) {
        console.log("Running in preview mode, no changes to the package.json files will be made.");
    }

    console.log("⏳ Fetching package data from NPM...");

    const lernaFile = await readJson("lerna.json");
    const versionFromLernaFile = lernaFile.version;

    console.log();

    if (PREVIEW) {
        console.log("🐰 After running the command, the following changes will be made:");
        console.log("=================================================================");
    } else {
        console.log("🐰️ The following changes were made:");
        console.log("===================================");
    }

    const packages = getPackages();

    for (let i = 0; i < packages.length; i++) {
        const p = packages[i];
        // Update only sample-project/* packages
        if (!p.includes("sample-project")) {
            continue;
        }
        const packageJsonPath = path.join(p, "package.json");
        try {
            const packageJson = await readJson(packageJsonPath);

            if (!mustProcessPackage(packageJson)) {
                continue;
            }

            console.log(`${cyan(packageJson.name)}`);
            const depsCount = processDeps({
                deps: packageJson.dependencies,
                nextFixedVersion: versionFromLernaFile
            });
            const devDepsCount = processDeps({
                deps: packageJson.devDependencies,
                nextFixedVersion: versionFromLernaFile
            });

            if (depsCount || devDepsCount) {
                !PREVIEW && (await writeJson(packageJsonPath, packageJson));
            } else {
                console.log("All up-to-date.");
            }

            console.log();
        } catch {}
    }

    process.exit(0);
})();

function mustProcessPackage(json) {
    const depsTypes = ["dependencies", "devDependencies"];
    for (let i = 0; i < depsTypes.length; i++) {
        let type = depsTypes[i];
        if (json[type]) {
            for (let name in json[type]) {
                if (WEBINY_PACKAGES.includes(name)) {
                    return true;
                }
            }
        }
    }
}

function processDeps({ deps, nextFixedVersion }) {
    let processedCount = 0;

    for (let key in deps) {
        if (!WEBINY_PACKAGES.includes(key)) {
            continue;
        }

        const currentVersion = deps[key];
        const newVersion = `^${nextFixedVersion}`;

        if (currentVersion !== newVersion) {
            console.log(`- ${key}@${blue(currentVersion)} => ${key}@${blue(newVersion)}`);
            deps[key] = newVersion;
            processedCount++;
        }
    }

    return processedCount;
}
