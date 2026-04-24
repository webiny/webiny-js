import execa from "execa";
import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";

const dirname = import.meta.dirname;

export default {
    commands: {
        build: async options => {
            await createBuildPackage({ cwd: dirname })(options);
            await execa("chmod", ["+x", `${dirname}/dist/bin.js`], { stdio: "inherit" });
        },
        watch: createWatchPackage({ cwd: dirname })
    }
};
