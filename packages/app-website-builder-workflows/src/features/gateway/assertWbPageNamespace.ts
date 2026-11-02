import { WB_PAGE_APP } from "~/constants.js";

export const assertWbPageNamespace = (namespace: string): void => {
    if (namespace !== WB_PAGE_APP) {
        throw new Error(`Invalid app name: "${namespace}".`);
    }
};
