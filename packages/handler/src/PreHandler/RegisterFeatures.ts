import { FastifyRequest, FastifyReply } from "fastify";
import { Context } from "~/types.js";
import { Action } from "./IPreHandler.js";
import type { IPreHandler } from "./IPreHandler.js";
import { RegisterFeaturePlugin } from "~/plugins/RegisterFeaturePlugin.js";

export class RegisterFeatures implements IPreHandler {
    public constructor(private readonly plugins: RegisterFeaturePlugin[]) {}

    public async execute(_: FastifyRequest, __: FastifyReply, context: Context): Promise<Action> {
        for (const plugin of this.plugins) {
            await plugin.apply(context.container);
        }

        return Action.CONTINUE;
    }
}
