import type { Container } from "@webiny/di";
import { type IProjectModel } from "~/abstractions/models/index.js";
import { ExtensionSrcResolver } from "./ExtensionSrcResolver.js";

export interface ISrcExtension {
    params: { src: string };
}

/**
 * Imports the module each extension's `src` points to and registers its default export in the
 * container, as a singleton. Used for config extensions whose job is to name an implementation,
 * such as the build, watch and deploy hooks.
 */
export const registerSrcExtensions = async (
    container: Container,
    extensions: ISrcExtension[],
    project: IProjectModel
) => {
    for (const extension of extensions) {
        const implementation = await ExtensionSrcResolver.importFromPath(
            extension.params.src,
            project
        );
        container.register(implementation).inSingletonScope();
    }
};
