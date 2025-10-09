import chalk from "chalk";
import execa from "execa";

const { green } = chalk;

// Set up environment files. This can be executed separately as well, via "yarn setup-env-files".
await import("./setupEnvFiles.js");

// Build all packages in the "packages" workspace.
console.log(`🏗  Building packages...`);
try {
    await execa("yarn", ["build"], {
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
    `Alternatively, to deploy a single project application, run ${green("yarn webiny deploy {folder} --env {env}")} command, for example: ${green("yarn webiny deploy apps/api --env dev")}.`
);

console.log(
    "To learn more, visit https://www.webiny.com/docs/how-to-guides/deployment/deploy-your-project."
);
