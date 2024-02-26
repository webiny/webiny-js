import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { LambdaContext } from "@webiny/handler-aws/types";
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
        debug: process.env.DEBUG === "true"
    });
    return {
        plugins,
        handler: () => {
            return handler({}, {} as LambdaContext);
        }
    };
};
