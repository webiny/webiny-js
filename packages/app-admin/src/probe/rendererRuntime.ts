import * as React from "react";
import { observer } from "mobx-react-lite";
import * as adminUi from "@webiny/admin-ui";
import {
    createFieldRenderer,
    createObjectFieldRenderer
} from "~/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "~/features/formModel/abstractions.js";

/**
 * PROBE. What a generated admin renderer is handed, and how it gets loaded.
 *
 * The injection set is deliberately everything the admin already loads, and nothing else — a
 * generated renderer must not be able to pull a dependency of its own. `observer` is in here because
 * the cold-generation probe proved it has to be: without it a child input does not re-render when
 * its own value changes, and the renderer still compiles, which is the worst way to be wrong.
 */
export interface RendererRuntime {
    version: "1";
    dependencies: {
        React: typeof React;
        ui: typeof adminUi;
        observer: typeof observer;
        createFieldRenderer: typeof createFieldRenderer;
        createObjectFieldRenderer: typeof createObjectFieldRenderer;
    };
}

export const createRendererRuntime = (): RendererRuntime => ({
    version: "1",
    dependencies: {
        React,
        ui: adminUi,
        observer,
        createFieldRenderer,
        createObjectFieldRenderer
    }
});

/** What a generated bundle must expose, mirroring how remote components are loaded. */
interface RendererModule {
    createRenderer(runtime: RendererRuntime): React.ComponentType<{ field: IFieldVM }>;
}

const GLOBAL_NAME = "__adminRenderer__";

/**
 * Turn a bundled IIFE into a field renderer component.
 *
 * `new Function` rather than a dynamic import: the bundle is a string held in the CMS, not a URL,
 * and the whole point is that nothing is fetched from a module server at render time. It is also
 * the same mechanism `ComponentEditorPresenter` already uses for remote components, so the
 * failure modes are ones we have seen before.
 *
 * No isolation whatsoever. This runs in the admin with the signed-in session, which is the trust
 * question that has to be settled before any of this is switched on for real.
 */
export const loadRenderer = (
    bundledJs: string,
    runtime: RendererRuntime
): React.ComponentType<{ field: IFieldVM }> => {
    const factory = new Function(
        `var ${GLOBAL_NAME}; ${bundledJs}; return ${GLOBAL_NAME};`
    ) as () => RendererModule;

    const module = factory();

    if (typeof module?.createRenderer !== "function") {
        throw new Error("The generated bundle does not export `createRenderer(runtime)`.");
    }

    return module.createRenderer(runtime);
};
