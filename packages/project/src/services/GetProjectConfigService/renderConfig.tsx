import { type IProjectConfigDto } from "~/abstractions/models/index.js";
import { type IProjectModel } from "~/abstractions/models/index.js";
import { type ProjectSdkParamsService } from "~/abstractions/index.js";
import { toImportSpecifier } from "~/utils/index.js";
import { renderExtensions } from "./renderExtensions.js";

export interface RenderConfigParams {
    project: IProjectModel;
    args?: Record<string, any>;
    sdkParams: ProjectSdkParamsService.Params;
}

/*
 * Renders `webiny.config.tsx` into the plain object the rest of the SDK works with.
 *
 * This used to happen in a forked child process, to work around the `Properties` context not being
 * available in the main process. That no longer reproduces, and the fork was expensive and awkward:
 * a second Node process booting and re-importing the whole of `@webiny/project`, anything the config
 * logged swallowed along with its stdout, and errors flattened through a serialise and deserialise
 * round trip that lost the stack pointing into the user's config.
 *
 * Renders are serialised because they install `window` and `document` as globals for the duration.
 */
let pendingRender: Promise<unknown> = Promise.resolve();

export const renderConfig = (params: RenderConfigParams): Promise<IProjectConfigDto> => {
    const startRender = () => renderConfigNow(params);

    const result = pendingRender.then(startRender, startRender);

    // A failed render must not poison the queue for whoever is behind it.
    pendingRender = result.then(
        () => undefined,
        () => undefined
    );

    return result;
};

const renderConfigNow = async (params: RenderConfigParams): Promise<IProjectConfigDto> => {
    const configPath = params.project.paths.webinyConfigBaseFile.toString();

    // Imported before any DOM global exists, so that module-level `typeof window` checks inside the
    // config's own import graph still see Node, exactly as they did in the child process.
    const configSpecifier = toImportSpecifier(configPath);
    const { Extensions } = await import(configSpecifier);

    return renderExtensions({ Extensions, sdkParams: params.sdkParams });
};
