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

    console.log(
        `\n🏁 Your repo is ready. Run ${green(
            "yarn webiny deploy api --env local"
        )} to deploy your API stack.`
    );
})();
