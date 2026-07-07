import type { PulumiApp } from "@webiny/pulumi";
import { getProjectSdk } from "@webiny/project";

type ProjectSdk = Awaited<ReturnType<typeof getProjectSdk>>;

/**
 * Resolves the list of production environments (registered via the
 * `Infra.ProductionEnvironments` extension, merged with the built-in defaults)
 * and updates `app.env.isProduction` accordingly.
 *
 * Without this, `app.env.isProduction` only ever reflects the hardcoded
 * `DEFAULT_PROD_ENV_NAMES` fallback, so custom production environments (e.g.
 * "stage") would not be treated as production - meaning production-only
 * infrastructure (such as the VPC) would never be created for them.
 *
 * Must be called at the very start of a Pulumi app program, before any modules
 * or resources that read `app.env.isProduction` are added.
 */
export const applyProductionEnvironments = async <TResources extends Record<string, unknown>>(
    app: PulumiApp<TResources>,
    sdk: ProjectSdk
) => {
    const productionEnvironments = await sdk.getProductionEnvironments();
    app.env = {
        ...app.env,
        isProduction: productionEnvironments.includes(app.env.name)
    };
};
