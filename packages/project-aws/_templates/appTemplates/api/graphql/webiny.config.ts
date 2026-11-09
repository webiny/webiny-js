import { createBuildFunction, createWatchFunction } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildFunction({
            cwd: import.meta.dirname,
            // Set by `<Infra.Api.WebFunction enabled />`: also build `src/web.ts` for the web function.
            web: process.env.WEBINY_API_WEB_FUNCTION === "true"
        }),
        watch: createWatchFunction({ cwd: import.meta.dirname })
    }
};
