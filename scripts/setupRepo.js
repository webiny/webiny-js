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

    console.log(`\n🏁 Your repo is almost ready!`);
    console.log(
        `Update ${green(
            ".env.json"
        )} with your MongoDB connection string and you're ready to develop!\n`
    );
})();
