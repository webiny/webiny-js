import { createAdminAppConfig,   } from "@webiny/serverless-cms-aws";

export default createAdminAppConfig(({ config }) => {
    // config.pulumiOutputToEnv("apps/api", {
    //     VALUE: "${api.url}"
    // })
    //
    // config.pulumiOutputToEnv<ApiOutput>("apps/api", ({ output, env }) => {
    //     return {
    //         ...env
    //     }
    // })
});

