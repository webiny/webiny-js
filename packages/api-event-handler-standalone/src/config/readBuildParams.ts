import { Container } from "@webiny/feature/api";
import { registerBuildParams } from "@webiny/handler";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { BuildParamsFeature } from "@webiny/api-core/features/buildParams/feature.js";

type Extensions = Parameters<typeof registerBuildParams>[1];

/**
 * The build params the project was built with, read once at startup in a throwaway container.
 * Requests register them in their own containers; this copy only lets the server check them before
 * it accepts any.
 */
export async function readBuildParams(extensions: Extensions): Promise<BuildParams.Interface> {
    const container = new Container();
    BuildParamsFeature.register(container);
    await registerBuildParams(container, extensions);
    return container.resolve(BuildParams);
}
