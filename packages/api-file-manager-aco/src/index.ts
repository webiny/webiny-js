import { ContextPlugin } from "@webiny/api";
import { createFileHooks, createImportExportFileHooks } from "~/file/hooks";
import { FmAcoContext } from "~/types";
import { createApp } from "~/app";

export * from "./createAppModifier";

export const createAcoFileManagerContext = () => {
    const plugin = new ContextPlugin<FmAcoContext>(async context => {
        if (!context.aco) {
            console.log(
                `There is no ACO initialized so we will not initialize the Page Builder ACO.`
            );
            return;
        }
        const app = await context.aco.registerApp(createApp());

        context.fileManagerAco = {
            app
        };

        createFileHooks(context);
    });
    plugin.name = `file-manager-aco.createContext`;
    return [plugin];
};

export const createAcoFileManagerImportExportContext = () => {
    const plugin = new ContextPlugin<FmAcoContext>(context => {
        if (!context.aco) {
            console.log(
                `There is no ACO initialized so we will not initialize the File Manager ACO.`
            );
            return;
        }
        createImportExportFileHooks(context);
    });
    plugin.name = `file-manager-aco.createImportExportContext`;

    return [plugin];
};
