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
    ].filter((value, index, self) => self.indexOf(value) === index);

    // Group by types, but only one plugin per group. Last in wins. This allows you to add plugins to the system
    // and not worry about the order of plugin registration.
    const byTypes = fileTypePlugins.reduce<
        Record<string, AdminFileManagerFileTypePlugin | FileManagerFileTypePlugin>
    >((acc, plugin) => {
        plugin.types.forEach(type => (acc[type] = plugin));
        return acc;
    }, {});

    // Sort by type and by priority. More occurrences of `*` means lower priority.
    const regExMatch = /\*/g;
    const types = Object.keys(byTypes).sort((a, b) => {
        const countA = (a.match(regExMatch) || []).length;
        const countB = (b.match(regExMatch) || []).length;
        if (countB > countA) {
            return -1;
        } else if (countB < countA) {
            return 1;
        }
        return 0;
    });

    // Find first matching type
    const type = types.find(type => minimatch(file.type, type));

    invariant(type, `Missing plugin to handle "${file.type}"!`);

    // return the plugin
    return byTypes[type];
}
