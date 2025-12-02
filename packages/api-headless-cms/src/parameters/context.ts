import { CmsParametersPlugin } from "~/plugins/CmsParametersPlugin.js";

export const createContextParameterPlugin = () => {
    return new CmsParametersPlugin(async () => {
        return {
            type: null
        };
    });
};
