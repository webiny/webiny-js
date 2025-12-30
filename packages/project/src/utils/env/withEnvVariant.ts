import { createConfiguration } from "./configuration.js";

export interface IWithEnvVariantParams {
    variant?: string;
}

export const withEnvVariant = (params: IWithEnvVariantParams) => {
    return createConfiguration(() => {
        const variant = (params.variant || "").trim();
        if (!variant) {
            return;
        }
        return {
            WBY_ENV_VARIANT: variant
        };
    });
};
