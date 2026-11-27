import type { Container } from "@webiny/di";
import { registerBuildParams } from "@webiny/handler";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { BuildParamsFeature } from "@webiny/api-core/features/buildParams/feature.js";

type Extensions = Parameters<typeof registerBuildParams>[1];

/**
 * Registers the build params the project was built with, and their reader, in the root container.
 * They come from the deploy, so they are the same for every request and every tenant: request
 * containers and tenant scopes read them from the root. Call it once, in the root, before anything
 * reads them (features gate themselves on `FeatureFlags`, a build param, at register() time).
 *
 * Returns the reader, for a root that needs a setting from them (or wants to check them) before any
 * request runs.
 */
export async function registerRootBuildParams(
    root: Container,
    extensions: Extensions
): Promise<BuildParams.Interface> {
    BuildParamsFeature.register(root);
    await registerBuildParams(root, extensions);
    return root.resolve(BuildParams);
}
