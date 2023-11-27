// @ts-expect-error
import { defineProject } from "@webiny/core";
// @ts-expect-error
import { configurePreset } from "@webiny/preset-aws";

export default defineProject({
    presets: [configurePreset({})],
    plugins: [],
    deploy: (env: string) => ({
        resourceName: (name: string) => `my-res-${env}-${name}`
    })
});
