import { createReactAppConfig, type ReactAppConfigModifier } from "./createReactAppConfig.js";

export const createAdminAppConfig = (modifier?: ReactAppConfigModifier) => {
    return createReactAppConfig(baseParams => {
        const { config, options } = baseParams;

        config.customEnv(env => ({
            ...env,
            PORT: process.env.PORT || 3001,
            WBY_ADMIN_ENV: options.env,
            WBY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS: process.env
                .WBY_TRASH_BIN_RETENTION_PERIOD_DAYS as string
        }));

        if (modifier) {
            modifier(baseParams);
        }
    });
};
