import { plugins } from "@webiny/plugins";
import invariant from "invariant";
import { AdminFileManagerFileTypePlugin } from "../../types";
import { FileManagerFileTypePlugin } from "../../plugins/FileManagerFileTypePlugin";

export default function getFileTypePlugin(file) {
    if (!file) {
        return null;
    }

    const fileTypePlugins = [
        ...plugins.byType<AdminFileManagerFileTypePlugin>("admin-file-manager-file-type"),
        ...plugins.byType<FileManagerFileTypePlugin>(FileManagerFileTypePlugin.type)
    ];

    let plugin = null;
    for (let i = 0; i < fileTypePlugins.length; i++) {
        const current = fileTypePlugins[i];
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
