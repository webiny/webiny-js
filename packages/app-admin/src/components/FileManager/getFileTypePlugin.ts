import invariant from "invariant";
import minimatch from "minimatch";
import { plugins } from "@webiny/plugins";
import { AdminFileManagerFileTypePlugin } from "~/types";
import { FileManagerFileTypePlugin } from "~/plugins/FileManagerFileTypePlugin";
import { FileItem } from "./types";

export default function getFileTypePlugin(
    file: FileItem
): AdminFileManagerFileTypePlugin | FileManagerFileTypePlugin | null {
    if (!file) {
        return null;
    }

    const fileTypePlugins = [
        ...plugins.byType<AdminFileManagerFileTypePlugin>("admin-file-manager-file-type"),
        ...plugins.byType<FileManagerFileTypePlugin>(FileManagerFileTypePlugin.type)
    ];

    /**
     * TODO: if we are searching last available plugin, we can refactor this.
     * TODO: check out @pavel
     */
    let plugin = null;
    for (let i = 0; i < fileTypePlugins.length; i++) {
        // We don't want to include the global wildcard in this check.
        const types = fileTypePlugins[i].types;
        if (!types) {
            continue;
        }
        if (types.find(t => minimatch(file.type, t))) {
            plugin = fileTypePlugins[i];
            break;
        }
    }

    invariant(plugin, `Missing plugin to handle "${file.type}"!`);

    return plugin;
}
