import { vi } from "vitest";
import { Context } from "@webiny/api/Context";
import type { Context as ContextType } from "~/types";
import type { Reply, Request } from "@webiny/handler/types.js";

export const createMockRequest = () => {
    return {
        request: {} as Request
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
        } as unknown as Reply
    };
};

export const createMockContext = () => {
    const { request } = createMockRequest();
    const { reply, sent, send } = createMockReply();
    const context = new Context({
        plugins: [],
        WEBINY_VERSION: process.env.WEBINY_VERSION as string
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
