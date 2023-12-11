import { RouteHandlerMethod } from "fastify";
import { Reply } from "@webiny/handler/types";
import { AssetReply } from "../abstractions/AssetReply";

export class S3ErrorReply implements AssetReply {
    private readonly message: string;

    constructor(message: string) {
        this.message = message;
    }

    async reply(reply: Reply): Promise<RouteHandlerMethod> {
        return reply.code(400).send({ error: this.message });
    }
}
