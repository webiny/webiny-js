const { green } = require("chalk");
const execa = require("execa");

/**
 * This simple script can be used to set up an existing Webiny project that was just cloned from an
 * existing repository. Right now it doesn't do much, but feel free to add additional logic if needed.
 */
(async () => {
    // Set up environment files. This can be executed separately as well, via "yarn setup-env-files".
    require("./setupEnvFiles");

    // Build all packages in the "packages" workspace.
    console.log(`🏗  Building packages...`);
    try {
        await execa("yarn", ["webiny", "workspaces", "run", "build", "--folder", "packages"], {
            stdio: "inherit"
        });
        console.log(`✅️ Packages were built successfully!`);
    } catch (err) {
        console.log(`🚨 Failed to build packages: ${err.message}`);
    }

    console.log();
    console.log(`🏁 Your repo is ready!`);
    console.log(`To completely deploy the project, run ${green("yarn webiny deploy")}.`);
    console.log(
        `Alternatively, to deploy a single project application, run ${green(
            "yarn webiny deploy {folder} --env {env}"
        )} command, for example: ${green("yarn webiny deploy api --env dev")}.`
    );

    console.log(
        "To learn more, visit https://www.webiny.com/docs/how-to-guides/deployment/deploy-your-project."
    );
})();
