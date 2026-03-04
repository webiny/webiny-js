import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import type { CmsIcon } from "~/types/index.js";

export const normalizeIcon = (icon: string | CmsIcon | undefined) => {
    let iconName: IconProp | undefined = undefined;
    if (icon) {
        const name = typeof icon === "string" ? icon : icon.name;
        iconName = name.split("/") as IconProp;
    }
    return iconName;
};
