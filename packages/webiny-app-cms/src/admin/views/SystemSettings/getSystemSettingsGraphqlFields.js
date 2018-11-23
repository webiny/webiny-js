// @flow
import { getPlugins } from "webiny-app/plugins";

export default () => {
    const plugins = getPlugins("cms-system-settings");
    return plugins.map(plugin => plugin.fields).join(" ");
};
