import { ContextPlugin } from "@webiny/api";
import { createFileHooks } from "~/file/hooks";
import { FmAcoContext } from "~/types";
import { createApp } from "~/app";

const createAcoFileManagerContextPlugin = () => {
    return new ContextPlugin<FmAcoContext>(async context => {
        const app = await context.aco.registerApp(createApp());

        context.fileManagerAco = {
            app
        };

        createFileHooks(context);
    });
};

export const createAcoFileManagerContext = () => {
    return [createAcoFileManagerContextPlugin()];
};
