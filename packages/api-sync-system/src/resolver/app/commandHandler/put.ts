import {
    CommandHandlerPlugin,
    createCommandHandlerPlugin
} from "~/resolver/plugins/CommandHandlerPlugin.js";
import { PutCommandHandler } from "./PutCommandHandler";

export const createPutCommandHandlerPlugin = () => {
    const plugin = createCommandHandlerPlugin({
        canHandle: command => {
            return command === "put";
        },
        handle: async params => {
            const handler = new PutCommandHandler(params);

            return handler.handle(params);
        }
    });

    plugin.name = `${CommandHandlerPlugin.type}.put`;

    return plugin;
};
