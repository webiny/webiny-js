import type { FastifyReply, FastifyRequest } from "fastify";
import { Action, IPreHandler } from "./IPreHandler";
import type { Context } from "~/types";

export class IfOptionsRequest implements IPreHandler {
    private readonly handlers: IPreHandler[];

    constructor(handlers: IPreHandler[]) {
        this.handlers = handlers;
    }

    async execute(request: FastifyRequest, reply: FastifyReply, context: Context): Promise<Action> {
        const isOptionsRequest = request.method === "OPTIONS";
        if (!isOptionsRequest) {
            return Action.CONTINUE;
        }

        for (const handler of this.handlers) {
            const action = await handler.execute(request, reply, context);
            if (action === Action.DONE) {
                return Action.DONE;
            }
        }

        return Action.CONTINUE;
    }
}
