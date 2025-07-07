import type { ComponentGroup } from "./types";
import { contentSdk } from "./ContentSdk";

export const registerComponentGroup = (group: ComponentGroup) => {
    const editingSdk = contentSdk.getEditingSdk();

    if (!editingSdk) {
        return;
    }

    editingSdk.registerComponentGroup(group);
};
