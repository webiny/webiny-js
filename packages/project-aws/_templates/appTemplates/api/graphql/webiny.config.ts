import { createBuildFunction, createWatchFunction } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildFunction({
            cwd: import.meta.dirname,
            // Also build `src/web.ts` for the web function, unless the project sets
            // `<Infra.Api.WebFunction enabled={false} />`.
            web: process.env.WEBINY_API_WEB_FUNCTION !== "false"
        }),
        watch: createWatchFunction({ cwd: import.meta.dirname })
    }
};
