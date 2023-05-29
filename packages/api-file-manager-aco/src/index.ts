import { ContextPlugin } from "@webiny/api";

import { createImportExportFileHooks, createFileHooks } from "~/file/hooks";

import { FmAcoContext } from "~/types";

export const createAcoFileManagerContext = () => {
    return new ContextPlugin<FmAcoContext>(context => {
        createFileHooks(context);
    });
};

export const createAcoFileManagerImportExportContext = () => {
    return new ContextPlugin<FmAcoContext>(context => {
        createImportExportFileHooks(context);
    });
};
