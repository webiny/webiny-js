import { ContextPlugin } from "@webiny/api";

import { createFileHooks } from "~/file/hooks";

import { FmAcoContext } from "~/types";

export const createAcoFileManagerContext = () => {
    return new ContextPlugin<FmAcoContext>(context => {
        createFileHooks(context);
    });
};
