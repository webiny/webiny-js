import { Container } from "@webiny/di";
import { registerBuildParams } from "@webiny/handler";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { BuildParamsFeature } from "@webiny/api-core/features/buildParams/feature.js";

type Extensions = Parameters<typeof registerBuildParams>[1];

/**
 * The build params the project was built with, read in a throwaway container. Requests register
 * them in their own containers; this copy is for the root, which needs a setting from them (or wants
 * to check them) before any request runs. Call it once per process.
 */
export async function readBuildParams(extensions: Extensions): Promise<BuildParams.Interface> {
    const container = new Container();
    BuildParamsFeature.register(container);
    await registerBuildParams(container, extensions);
    return container.resolve(BuildParams);
}
