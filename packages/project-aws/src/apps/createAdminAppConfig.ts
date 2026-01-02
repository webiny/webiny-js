import { createReactAppConfig, type ReactAppConfigModifier } from "./createReactAppConfig.js";

export const createAdminAppConfig = (modifier?: ReactAppConfigModifier) => {
    return createReactAppConfig(baseParams => {
        const { config, options } = baseParams;

        config.customEnv(env => ({
            ...env,
            PORT: process.env.PORT || 3001,
            WEBINY_ADMIN_ENV: options.env,
            WEBINY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS: process.env
                .WEBINY_TRASH_BIN_RETENTION_PERIOD_DAYS as string
        }));

        if (modifier) {
            modifier(baseParams);
        }
    });
};
