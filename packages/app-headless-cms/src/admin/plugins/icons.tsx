import type { IconName } from "@fortawesome/fontawesome-svg-core";
import { library } from "@fortawesome/fontawesome-svg-core";
import type { IconPrefix } from "@fortawesome/fontawesome-common-types";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import type { IconPickerIconDto } from "@webiny/admin-ui";
import type { CmsIconsPlugin } from "~/types.js";

library.add(fab, fas, far);

const icons: IconPickerIconDto[] = [];

const getDefinitions = (input: any): Record<IconPrefix, Record<IconName, string[]>> => {
    if (!input?.definitions) {
        throw new Error(
            "FontAwesome library does not contain definitions. Make sure to add icons to the library before trying to get definitions."
        );
    }
    return input.definitions as unknown as Record<IconPrefix, Record<IconName, string[]>>;
};

const plugin: CmsIconsPlugin = {
    name: "cms-icons-fontawesome",
    type: "cms-icons",
    init() {
        const definitions = getDefinitions(library);
        for (const p in definitions) {
            const pack = p as keyof typeof definitions;
            const defs = definitions[pack];
            for (const icon in defs) {
                icons.push({
                    prefix: pack,
                    name: icon
                });
            }
        }
    },
    getIcons() {
        return icons;
    }
};

export default plugin;
