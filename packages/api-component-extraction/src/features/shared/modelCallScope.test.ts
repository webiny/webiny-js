import { describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import { ModelCallScope, ModelCallScopeService } from "./modelCallScope.js";

const scopeService = () => {
    const container = new Container();
    container.register(ModelCallScopeService);
    return container.resolve(ModelCallScope);
};

describe("ModelCallScope.forComponent", () => {
    it("narrows the current scope to one component for the calls inside", async () => {
        const scope = scopeService();
        const seen = await scope.run({ runId: "r1", stage: "plan", stageVersion: 2 }, () =>
            scope.forComponent("sig-a", async () => scope.current())
        );
        expect(seen).toEqual({ runId: "r1", stage: "plan", stageVersion: 2, signature: "sig-a" });
    });

    it("leaves the outer scope as it was", async () => {
        const scope = scopeService();
        const after = await scope.run({ runId: "r1", stage: "plan", stageVersion: 2 }, async () => {
            await scope.forComponent("sig-a", async () => undefined);
            return scope.current();
        });
        expect(after?.signature).toBeUndefined();
    });

    it("runs the work unscoped outside any scope", async () => {
        const scope = scopeService();
        expect(await scope.forComponent("sig-a", async () => scope.current())).toBeNull();
    });
});
