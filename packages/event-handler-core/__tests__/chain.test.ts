import { describe, it, expect } from "vitest";
import { executeChain } from "~/chain.js";
import type { EventContext, IEventHandler } from "~/abstractions/EventHandler.js";
import type { NextFunction } from "~/types.js";

const makeHandler = (fn: (ctx: EventContext, next: NextFunction) => Promise<any>): IEventHandler => ({
    execute: fn
});

describe("executeChain", () => {
    it("should execute handlers in registration order", async () => {
        const log: string[] = [];

        const handlers = [
            makeHandler(async (_ctx, next) => { log.push("1"); return next(); }),
            makeHandler(async (_ctx, next) => { log.push("2"); return next(); }),
            makeHandler(async (_ctx, _next) => { log.push("3"); return "done"; })
        ];

        await executeChain(handlers, {});
        expect(log).toEqual(["1", "2", "3"]);
    });

    it("should pass translated event via next(newCtx)", async () => {
        const handlers = [
            makeHandler(async (ctx, next) => {
                return next({ event: { ...ctx.event, translated: true }, metadata: ctx.metadata });
            }),
            makeHandler(async (ctx, _next) => {
                return ctx.event;
            })
        ];

        const result = await executeChain(handlers, { original: true });
        expect(result).toEqual({ original: true, translated: true });
    });

    it("should preserve metadata across next() calls", async () => {
        const handlers = [
            makeHandler(async (ctx, next) => {
                ctx.metadata.step1 = true;
                return next();
            }),
            makeHandler(async (ctx, _next) => {
                return ctx.metadata;
            })
        ];

        const result = await executeChain(handlers, {});
        expect(result).toEqual({ step1: true });
    });

    it("should throw when no handler claims the event", async () => {
        const handlers = [
            makeHandler(async (_ctx, next) => next())
        ];

        await expect(executeChain(handlers, {})).rejects.toThrow(
            "No registered handler claimed this event"
        );
    });

    it("should throw when handlers array is empty", async () => {
        expect(() => executeChain([], {})).toThrow("No handlers registered in container");
    });
});
