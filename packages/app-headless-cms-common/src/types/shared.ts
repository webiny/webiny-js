import type { IconPickerIconDto } from "@webiny/admin-ui";
import type { Plugin } from "@webiny/plugins/types.js";

export interface CmsIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface CmsIconsPlugin extends Plugin {
    type: "cms-icons";
    getIcons(): IconPickerIconDto[];
}
