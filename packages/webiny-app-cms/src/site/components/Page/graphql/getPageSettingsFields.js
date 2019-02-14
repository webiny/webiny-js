// @flow
import { getPlugins } from "webiny-plugins";
import type { CmsPageSettingsFieldsPluginType } from "webiny-app-cms/types";

export default () => {
    return getPlugins("cms-page-settings-fields")
        .map((pl: CmsPageSettingsFieldsPluginType) => pl.fields)
        .join("\n");
};
