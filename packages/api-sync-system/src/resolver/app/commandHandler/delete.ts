import {
    CommandHandlerPlugin,
    createCommandHandlerPlugin
} from "~/resolver/plugins/CommandHandlerPlugin.js";
import { DeleteCommandHandler } from "./DeleteCommandHandler";

export const createDeleteCommandHandlerPlugin = () => {
    const plugin = createCommandHandlerPlugin({
        canHandle: command => {
            return command === "delete";
        },
        handle: async params => {
            const handler = new DeleteCommandHandler(params);

            return handler.handle(params);
        }
    });

    plugin.name = `${CommandHandlerPlugin.type}.delete`;

    return plugin;
};
