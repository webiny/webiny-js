import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { FileManagerContext } from "~/types";
import { handlerPlugins, HandlerParams } from "./plugins";

export const useHandler = (params: HandlerParams = {}) => {
    const corePlugins = handlerPlugins(params);

    const plugins = [...corePlugins].concat([
        createRawEventHandler<any, FileManagerContext, FileManagerContext>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<any, FileManagerContext>({
        plugins,
        http: {
            debug: process.env.DEBUG === "true"
        }
    });
    return {
        plugins,
        handler: () => {
            return handler({}, {} as any);
        }
    };
};
