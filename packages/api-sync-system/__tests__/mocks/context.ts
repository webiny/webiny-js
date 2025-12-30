import { vi } from "vitest";
import { Context } from "@webiny/api/Context";
import type { Context as ContextType } from "~/types";
import type { Reply as FastifyReply, Request as FastifyRequest } from "@webiny/handler/types.js";

export const createMockRequest = () => {
    return {
        request: {} as FastifyRequest
    };
};

export const createMockReply = () => {
    const sent: unknown[] = [];
    const send = vi.fn();
    return {
        sent,
        send,
        reply: {
            send: (data: unknown) => {
                sent.push(data);
                return send(data);
            }
        } as unknown as FastifyReply
    };
};

export const createMockContext = () => {
    const { request } = createMockRequest();
    const { reply, sent, send } = createMockReply();
    const context = new Context({
        plugins: [],
        WBY_VERSION: process.env.WBY_VERSION as string
    }) as unknown as ContextType;

    return {
        context,
        request,
        reply,
        getSent: () => {
            return sent;
        },
        getSend: () => {
            return send;
        }
    };
};
