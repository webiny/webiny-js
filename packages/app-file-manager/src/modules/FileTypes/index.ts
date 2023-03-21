import { plugins } from "@webiny/plugins";
import { FileManagerFileTypePlugin } from "~/FileManagerFileTypePlugin";
import { defaultFileTypePlugin } from "./fileDefault";
import { imageFileTypePlugin } from "./fileImage";

function registerFileTypePlugins() {
    // This is an ugly hack, which we will replace when we implement file thumbnail rendering via the Composition API.
    const fileTypePlugins = plugins.byType(FileManagerFileTypePlugin.type);

    // First we need to unregister already registered plugins.
    fileTypePlugins.forEach(pl => plugins.unregister(pl.name as string));

    // Then, we need to register the default plugins first, then register user's plugins again, to generate new names.
    plugins.register([
        defaultFileTypePlugin,
        imageFileTypePlugin,
        ...fileTypePlugins.map(pl => {
            pl.name = undefined;
            return pl;
        })
    ]);
}

export const FileTypesModule = () => {
    registerFileTypePlugins();

    return null;
};
