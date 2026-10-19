import { MenuSourceSchema } from "~/shared/adminExtensions/menuSource.js";
import { parseJson } from "~/shared/adminExtensions/parseJson.js";
import { ADMIN_EXTENSION_RUNTIME_VERSION } from "~/shared/adminExtensions/constants.js";
import type { AdminExtensionDto } from "~/shared/adminExtensions/types.js";
import type { EnabledExtensionsPresenter } from "./abstractions.js";

/**
 * Turns a stored menu into a sidebar item, or `null` when it should not be shown.
 *
 * Skips anything written for a newer runtime than this admin knows, and anything whose source does
 * not parse: one broken entry must not take the sidebar down. The name is prefixed so a generated
 * item can never replace or nest under a built-in one by sharing its name.
 */
export function toExtensionMenu(
    extension: AdminExtensionDto
): EnabledExtensionsPresenter.Menu | null {
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
