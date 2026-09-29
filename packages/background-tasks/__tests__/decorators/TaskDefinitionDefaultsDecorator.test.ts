import { describe, it, expect } from "vitest";
import { TaskDefinitionDefaultsDecoratorImpl } from "~/api/decorators/TaskDefinitionDefaultsDecorator.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

const makeDefinition = (
    overrides: Partial<TaskDefinition.Interface> = {}
): TaskDefinition.Interface =>
    ({
        id: "defA",
        title: "test",
        handler: class {} as any,
        ...overrides
    }) as TaskDefinition.Interface;

describe("TaskDefinitionDefaultsDecorator", () => {
    describe("defaults", () => {
        it("defaults isPrivate, databaseLogs and maxIterations", () => {
            const dec = new TaskDefinitionDefaultsDecoratorImpl(makeDefinition());

            expect(dec.isPrivate).toBe(false);
            expect(dec.databaseLogs).toBe(false);
            expect(dec.maxIterations).toBe(50);
        });

        it("leaves values the definition set alone", () => {
            const dec = new TaskDefinitionDefaultsDecoratorImpl(
                makeDefinition({ isPrivate: true, maxIterations: 7 })
            );

            expect(dec.isPrivate).toBe(true);
            expect(dec.maxIterations).toBe(7);
        });

        it("rejects an id that is not camelCase", () => {
            expect(
                () => new TaskDefinitionDefaultsDecoratorImpl(makeDefinition({ id: "not-camel" }))
            ).toThrow(/must be in camelCase/);
        });
    });

    describe("normalization", () => {
        it("keeps databaseLogs when selfCleanup is undefined", () => {
            const dec = new TaskDefinitionDefaultsDecoratorImpl(
                makeDefinition({ databaseLogs: true })
            );
            expect(dec.databaseLogs).toBe(true);
        });

        it("keeps databaseLogs when selfCleanup is 'never'", () => {
            const dec = new TaskDefinitionDefaultsDecoratorImpl(
                makeDefinition({ databaseLogs: true, selfCleanup: "never" })
            );
            expect(dec.databaseLogs).toBe(true);
        });

        it("forces databaseLogs=false when selfCleanup is a single event", () => {
            const dec = new TaskDefinitionDefaultsDecoratorImpl(
                makeDefinition({ databaseLogs: true, selfCleanup: "onSuccess" })
            );
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is an array", () => {
            const dec = new TaskDefinitionDefaultsDecoratorImpl(
                makeDefinition({ databaseLogs: true, selfCleanup: ["onSuccess", "onAbort"] })
            );
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is 'always'", () => {
            const dec = new TaskDefinitionDefaultsDecoratorImpl(
                makeDefinition({ databaseLogs: true, selfCleanup: "always" })
            );
            expect(dec.databaseLogs).toBe(false);
        });
    });
});
