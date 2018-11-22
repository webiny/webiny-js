// @flow
import { getPlugins } from "webiny-app/plugins";

export default () => {
    const plugins = getPlugins("cms-website-settings");
    return plugins.map(plugin => plugin.fields).join("\n");
};
