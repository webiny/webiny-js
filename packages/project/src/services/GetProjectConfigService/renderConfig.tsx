import { type IProjectConfigDto } from "~/abstractions/models/index.js";
import { type IProjectModel } from "~/abstractions/models/index.js";
import { type ProjectSdkParamsService } from "~/abstractions/index.js";
import { toImportSpecifier } from "~/utils/index.js";
import { renderExtensions } from "./renderExtensions.js";

export interface RenderConfigParams {
    project: IProjectModel;
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
 *
 * There is no `args` here any more. The child process put `{ project, args }` into its `process.argv`
 * and read the project back out; the args half was never read by anything, and reproducing it would
 * now mean rewriting the CLI's own `process.argv` mid-run. `renderArgs` still does its real job in
 * `GetProjectConfigService`, where it keys the render cache so that build and watch get their own
 * configs. If an extension ever needs those values, a context is the shape to give them.
 */
// Settles when the most recently queued render has finished, whether it succeeded or failed. It never
// rejects, so a failed render cannot block the ones queued behind it.
let lastQueuedRender: Promise<void> = Promise.resolve();

export const renderConfig = async (params: RenderConfigParams): Promise<IProjectConfigDto> => {
    // Take our place in the queue straight away, before any `await`. If two calls arrive together,
    // this is what makes the second one wait for the first rather than both starting at once.
    const previousRender = lastQueuedRender;

    let markThisRenderDone: () => void = () => undefined;
    const thisRender = new Promise<void>(resolve => {
        markThisRenderDone = resolve;
    });

    lastQueuedRender = thisRender;

    // Wait for whoever was ahead of us to finish with the DOM globals.
    await previousRender;

    try {
        return await renderConfigNow(params);
    } finally {
        // Let the next render in, no matter how this one ended.
        markThisRenderDone();
    }
};

const renderConfigNow = async (params: RenderConfigParams): Promise<IProjectConfigDto> => {
    const configPath = params.project.paths.webinyConfigBaseFile.toString();

    // Imported before any DOM global exists, so that module-level `typeof window` checks inside the
    // config's own import graph still see Node, exactly as they did in the child process.
    const configSpecifier = toImportSpecifier(configPath);
    const { Extensions } = await import(configSpecifier);

    return renderExtensions({ Extensions, sdkParams: params.sdkParams });
};
