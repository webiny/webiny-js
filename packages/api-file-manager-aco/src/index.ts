import { ContextPlugin } from "@webiny/api";
import { createFileHooks, createImportExportFileHooks } from "~/file/hooks";
import { FmAcoContext } from "~/types";
import { createApp } from "~/app";

export * from "./createAppModifier";

export const createAcoFileManagerContext = () => {
    return [
        new ContextPlugin<FmAcoContext>(async context => {
            const app = await context.aco.registerApp(createApp());

            context.fileManagerAco = {
                app
            };

            createFileHooks(context);
        })
    ];
};

export const createAcoFileManagerImportExportContext = () => {
    return [
        new ContextPlugin<FmAcoContext>(context => {
            createImportExportFileHooks(context);
        })
    ];
};
