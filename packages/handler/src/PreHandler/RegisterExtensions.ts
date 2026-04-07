import { FastifyRequest, FastifyReply } from "fastify";
import { Context } from "~/types.js";
import { Action } from "./IPreHandler.js";
import type { IPreHandler } from "./IPreHandler.js";
import { RegisterExtensionPlugin } from "~/plugins/RegisterExtensionPlugin.js";

export class RegisterExtensions implements IPreHandler {
    public constructor(private readonly plugins: RegisterExtensionPlugin[]) {}

    public async execute(_: FastifyRequest, __: FastifyReply, context: Context): Promise<Action> {
        for (const plugin of this.plugins) {
            plugin.apply(context.container);
        }

        return Action.CONTINUE;
    }
}
