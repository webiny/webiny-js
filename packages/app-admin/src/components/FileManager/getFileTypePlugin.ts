import { getPlugins, getPlugin } from "@webiny/plugins";
import invariant from "invariant";
import { AdminFileManagerFileTypePlugin } from "@webiny/app-admin/types";

export default function getFileTypePlugin(file) {
    if (!file) {
        return null;
    }

    const plugins = getPlugins<AdminFileManagerFileTypePlugin>("admin-file-manager-file-type");

    let plugin = null;
    for (let i = 0; i < plugins.length; i++) {
        const current = plugins[i];
        if (Array.isArray(current.types) && current.types.includes(file.type)) {
            plugin = current;
        }
    }

    if (!plugin) {
        plugin = getPlugin("file-manager-file-type-default");
        invariant(plugin, `Missing default "file-manager-file-type" plugin.`);
    }

    return plugin;
}
