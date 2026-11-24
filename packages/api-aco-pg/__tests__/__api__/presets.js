import { resolve } from "path";

export default [
    {
        setupFiles: [resolve(import.meta.dirname, "setupFile.js")],
        setupFilesAfterEnv: [resolve(import.meta.dirname, "setupAfterEnv.js")]
    }
];
