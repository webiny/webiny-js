import { MenuSourceSchema } from "~/shared/adminExtensions/menuSource.js";
import { ADMIN_EXTENSION_RUNTIME_VERSION } from "~/shared/adminExtensions/constants.js";
import type { AdminExtensionDto } from "~/shared/adminExtensions/types.js";
import type { ExtensionMenusPresenter } from "./abstractions.js";

function parseJson(source: string): unknown {
    try {
        return JSON.parse(source);
    } catch {
        return undefined;
    }
}

/**
 * Turns a stored menu into a sidebar item, or `null` when it should not be shown.
 *
 * Skips anything written for a newer runtime than this admin knows, and anything whose source does
 * not parse: one broken entry must not take the sidebar down. The name is prefixed so a generated
 * item can never replace or nest under a built-in one by sharing its name.
 */
export function toExtensionMenu(extension: AdminExtensionDto): ExtensionMenusPresenter.Menu | null {
    if (extension.runtimeVersion > ADMIN_EXTENSION_RUNTIME_VERSION) {
        return null;
    }

    const json = parseJson(extension.source);
    const parsed = MenuSourceSchema.safeParse(json);
    if (!parsed.success) {
        return null;
    }

    return {
        name: `adminExtension.${extension.name}`,
        label: parsed.data.label,
        to: parsed.data.to,
        parent: parsed.data.parent,
        pinnable: parsed.data.pinnable
    };
}
