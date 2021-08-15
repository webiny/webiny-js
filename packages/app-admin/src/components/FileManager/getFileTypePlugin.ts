import invariant from "invariant";
import minimatch from "minimatch";
import { plugins } from "@webiny/plugins";
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
        // We don't want to include the global wildcard in this check.
        const types = fileTypePlugins[i].types;
        if (types.find(t => minimatch(file.type, t))) {
            plugin = fileTypePlugins[i];
        }
    }

    invariant(plugin, `Missing plugin to handle "${file.type}"!`);

    return plugin;
}
