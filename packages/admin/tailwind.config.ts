import type { Config } from "tailwindcss";

import { webinyPreset } from "./src/lib/webiny-preset";

const config = {
    presets: [webinyPreset],
    content: ["node_modules/@webiny/admin/**/*.js", __dirname + "/src/**/*.tsx"]
} as Config;

export default config;
