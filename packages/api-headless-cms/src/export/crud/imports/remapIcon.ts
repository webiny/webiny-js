import type { CmsIcon } from "~/types/index.js";

export const remapIcon = (iconToRemap: string | CmsIcon | null | undefined): CmsIcon | null => {
    if (!iconToRemap) {
        return null;
    }

    if (typeof iconToRemap === "string") {
        return { type: "icon", name: iconToRemap };
    }

    return iconToRemap;
};
