const path = require("path");
const execa = require("execa");
const { createMorphProject, addPackagesToDependencies } = require("../utils");
const {
    upgradeGraphQLIndex,
    upgradeGraphQLSecurity,
    upgradeHeadlessSecurity,
    upgradeAdminApp,
    upgradeAdminGetIdentityData,
    upgradeAdminSecurity
} = require("./upgradeSecurity");

const { upgradeTelemetry } = require("./upgradeTelemetry");
const { upgradeScaffolding } = require("./upgradeScaffolding");

const targetVersion = "5.9.0";

/**
 * @type {CliUpgradePlugin}
 */
module.exports = {
    name: "upgrade-5.9.0",
    type: "cli-upgrade",
    version: targetVersion,
    /**
     * @param options {CliUpgradePluginOptions}
     * @param context {CliContext}
     * @returns {Promise<boolean>}
     */
    async canUpgrade(options, context) {
        if (context.version === targetVersion) {
            return true;
        }
        throw new Error(
            `Upgrade must be on Webiny CLI version "${targetVersion}". Current CLI version is "${context.version}".`
        );
    },

    /**
     * @param options {CliUpgradePluginOptions}
     * @param context {CliContext}
     * @returns {Promise<void>}
     */
    async upgrade(options, context) {
        const { info, error } = context;

        const files = [
            "api/code/graphql/src/index.ts",
            "api/code/graphql/src/security.ts",
            "api/code/headlessCMS/src/security.ts",
            "apps/admin/code/src/App.tsx",
            "apps/admin/code/src/components/getIdentityData.ts",
            "apps/admin/code/src/plugins/security.ts",
            "apps/admin/code/src/components/Telemetry.tsx"
        ];

        const upgrade = createMorphProject(files.map(f => path.resolve(process.cwd(), f)));

        // api/code/graphql/src/index.ts
        await upgradeGraphQLIndex(upgrade.getSourceFile(files[0]), files[0], context);

        // api/code/graphql/src/security.ts
        await upgradeGraphQLSecurity(upgrade.getSourceFile(files[1]), files[1], context);

        // api/code/headlessCMS/src/security.ts
        await upgradeHeadlessSecurity(upgrade.getSourceFile(files[2]), files[2], context);

        // apps/admin/code/src/App.tsx
        await upgradeAdminApp(upgrade.getSourceFile(files[3]), files[3], context);

        // apps/admin/code/src/components/getIdentityData.ts
        await upgradeAdminGetIdentityData(upgrade.getSourceFile(files[4]), files[4], context);

        // apps/admin/code/src/plugins/security.ts
        await upgradeAdminSecurity(upgrade.getSourceFile(files[5]), files[5], context);

        // apps/admin/code/src/components/Telemetry.tsx
        await upgradeTelemetry(upgrade.getSourceFile(files[6]), files[6], context);

        context.info("Adding dependencies...");

        addPackagesToDependencies(path.resolve(process.cwd(), "api/code/graphql"), {
            "@webiny/api-security-tenancy": null,
            "@webiny/api-security-admin-users": targetVersion,
            "@webiny/api-security-admin-users-cognito": targetVersion,
            "@webiny/api-security-cognito-authentication": targetVersion,
            "@webiny/api-tenancy": targetVersion
        });

        addPackagesToDependencies(path.resolve(process.cwd(), "api/code/headlessCMS"), {
            "@webiny/api-plugin-security-cognito": null,
            "@webiny/api-security-tenancy": null,
            "@webiny/api-security-admin-users": targetVersion,
            "@webiny/api-security-cognito-authentication": targetVersion,
            "@webiny/api-tenancy": targetVersion
        });

        addPackagesToDependencies(path.resolve(process.cwd(), "apps/admin/code"), {
            "@webiny/app-plugin-security-cognito": null,
            "@webiny/app-security-tenancy": null,
            "@webiny/app-security-admin-users": targetVersion,
            "@webiny/app-security-admin-users-cognito": targetVersion,
            "@webiny/app-tenancy": targetVersion,
            "@webiny/tracking": null,
            "@webiny/telemetry": targetVersion
        });

        context.info("Writing changes...");
        await upgrade.save();

        // Perform scaffolding and DX related upgrades.
        await upgradeScaffolding(context, targetVersion);

        try {
            info("Running prettier...");
            const config = context.resolve(".prettierrc.js");
            const { stdout: prettierBin } = await execa("yarn", ["bin", "prettier"]);
            const source = files.map(f => path.resolve(process.cwd(), f));
            await execa("node", [prettierBin, "--write", "--config", config, ...source]);
            info("Finished formatting files.");
        } catch (ex) {
            console.log(error.hl("Prettier failed."));
            console.log(error(ex.message));
            if (ex.stdout) {
                console.log(ex.stdout);
            }
        }

        /**
         * Run yarn to install new package
         */
        try {
            info("Installing new packages...");
            await execa("yarn");
            info("Finished installing new packages.");
        } catch (ex) {
            error("Installation of new packages failed.");
            console.log(error(ex.message));
            if (ex.stdout) {
                console.log(ex.stdout);
            }
        }
    }
};
