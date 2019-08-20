// @flow
import { getPlugins } from "webiny-plugins";
import type { PbPageSettingsFieldsPluginType } from "webiny-app-page-builder/types";

export default () => {
    return getPlugins("pb-page-settings-fields")
        .map((pl: PbPageSettingsFieldsPluginType) => pl.fields)
        .join("\n");
};
