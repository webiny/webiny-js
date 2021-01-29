import { plugins } from "@webiny/plugins";
import invariant from "invariant";
import { AdminFileManagerFileTypePlugin } from "@webiny/app-admin/types";

export default function getFileTypePlugin(file) {
    if (!file) {
        return null;
    }

    const pluginsByType = plugins.byType<AdminFileManagerFileTypePlugin>(
        "admin-file-manager-file-type"
    );

    let plugin = null;
    for (let i = 0; i < pluginsByType.length; i++) {
        const current = pluginsByType[i];
        if (Array.isArray(current.types) && current.types.includes(file.type)) {
            plugin = current;
        }
    }

    if (!plugin) {
        plugin = plugins.byName("file-manager-file-type-default");
        invariant(plugin, `Missing default "file-manager-file-type" plugin.`);
    }

    return plugin;
}
