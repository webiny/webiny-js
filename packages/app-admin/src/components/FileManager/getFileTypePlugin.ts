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
    ]
    // make it unique
    .filter((value, index, self) => self.indexOf(value) === index);

    // group by types, but only one plugin per group. it does not make any sence to have more plugins per type
    // first in wins!
    const byTypes = fileTypePlugins.reduce((acc, plugin) => {
        plugin.types.forEach((type) => acc[type] = acc[type] || plugin);
        return acc;
    }, {});

    // sort bye type. but sort it by priority. more * lower prio, less * higher prio
    const regExMatch = /\*/g;
    const types = Object.keys(byTypes).sort((a, b) => {
        const countA = (a.match(regExMatch) || []).length;
        const countB = (b.match(regExMatch) || []).length;
        if (countB > countA) {
            return -1;
        }
        else if (countB < countA) {
            return 1;
        }
        return 0;
    });

    // find first matching type
    const type = types.find((type) => minimatch(file.type, type));

    // nothing found
    invariant(type, `Missing plugin to handle "${file.type}"!`);

    // return the plugin
    return byTypes[type];
}
