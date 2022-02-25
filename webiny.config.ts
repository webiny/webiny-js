import { defineProject } from "@webiny/core";
import { configurePreset } from "@webiny/preset-aws";

export default defineProject({
    presets: [configurePreset({})],
    plugins: [],
    deploy: env => ({
        resourceName: name => `my-res-${env}-${name}`
    })
});
