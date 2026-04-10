import { FastifyRequest, FastifyReply } from "fastify";
import type { Context } from "~/types.js";
import { Action } from "./IPreHandler.js";
import type { IPreHandler } from "./IPreHandler.js";
import { RegisterExtensionPlugin } from "~/plugins/RegisterExtensionPlugin.js";

export class RegisterExtensions implements IPreHandler {
    public constructor(private readonly plugins: RegisterExtensionPlugin[]) {}

    public async execute<C extends Context = Context>(
        _: FastifyRequest,
        __: FastifyReply,
        context: C
    ): Promise<Action> {
        for (const plugin of this.plugins) {
            await plugin.apply(context);
        }

        return Action.CONTINUE;
    }
}
