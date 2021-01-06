const { green } = require("chalk");
const execa = require("execa");

(async () => {
    require("./setupEnvFiles");

    // Build all repo packages
    console.log(`🏗  Building packages...`);
    try {
        await execa("lerna", ["run", "build", "--stream"], {
            stdio: "inherit"
        });
        console.log(`✅️ Packages were built successfully!`);
    } catch (err) {
        console.log(`🚨 Failed to build packages: ${err.message}`);
    }

    console.log()
    console.log(`🏁 Your repo is ready!`);
    console.log(`💡 To deploy a new project, run ${green("yarn webiny deploy")} to deploy.`);
    console.log(`💡 Alternatively, to deploy a stack separately, run ${green("yarn webiny stack deploy")} command.`);
})();
