import { defineProject } from "@webiny/core";
import { configurePreset } from "@webiny/preset-aws";

export default defineProject({
    presets: [configurePreset({})],
    plugins: [],
    deploy: (env: string) => ({
        resourceName: (name: string) => `my-res-${env}-${name}`
    })
});
