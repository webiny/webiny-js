import { applyDefaults } from "./utils";
import { createWatchConfig, WatchOptions } from "./createWatchConfig";

export const watchApp = (options: WatchOptions) => {
    applyDefaults();

    if (!("REACT_APP_DEBUG" in process.env)) {
        process.env.REACT_APP_DEBUG = "true";
    }

    process.env.NODE_ENV = "development";

    return createWatchConfig(options);
};
