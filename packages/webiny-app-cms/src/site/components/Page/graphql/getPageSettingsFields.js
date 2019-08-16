// @flow
import { getPlugins } from "webiny-plugins";
import type { PageBuilderPageSettingsFieldsPluginType } from "webiny-app-cms/types";

export default () => {
    return getPlugins("pb-page-settings-fields")
        .map((pl: PageBuilderPageSettingsFieldsPluginType) => pl.fields)
        .join("\n");
};
