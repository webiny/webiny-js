import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import type { CmsIcon } from "@webiny/app-headless-cms-common/types/index.js";

/**
 * Converts a stored icon ("prefix/name") into a FontAwesome icon tuple.
 * Returns undefined when the value is missing or not in the "prefix/name" format.
 */
export const normalizeIcon = (icon: string | CmsIcon | undefined): IconProp | undefined => {
    if (!icon) {
        return undefined;
    }
    const name = typeof icon === "string" ? icon : icon.name;
    if (!name) {
        return undefined;
    }
    const [prefix, iconName, ...rest] = name.split("/");
    if (!prefix || !iconName || rest.length > 0) {
        return undefined;
    }
    return [prefix, iconName] as IconProp;
};
