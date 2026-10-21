import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/abstractions.js";
import { PrivateTaskDefinitions } from "~/api/features/PrivateTaskDefinitions/index.js";
import { PrivateTaskDefinitionsFeature } from "~/api/features/PrivateTaskDefinitions/feature.js";

interface IDefinitionPrivacy {
    id: string;
    isPrivate?: boolean;
}

const createPrivateTaskDefinitions = (definitions: IDefinitionPrivacy[]) => {
    const container = new Container();
    container.registerInstance(ListTaskDefinitionsUseCase, {
        execute: () => definitions as TaskDefinition.Interface[]
    });
    PrivateTaskDefinitionsFeature.register(container);
    return container.resolve(PrivateTaskDefinitions);
};

describe("PrivateTaskDefinitions (R180)", () => {
    it("returns the ids of the private definitions only", () => {
        const privateDefinitions = createPrivateTaskDefinitions([
            { id: "publicTask", isPrivate: false },
            { id: "privateTask", isPrivate: true },
            { id: "unsetTask" },
            { id: "anotherPrivateTask", isPrivate: true }
        ]);

        expect(privateDefinitions.getIds()).toEqual(["privateTask", "anotherPrivateTask"]);
        expect(privateDefinitions.isPrivate("privateTask")).toBe(true);
        expect(privateDefinitions.isPrivate("publicTask")).toBe(false);
        expect(privateDefinitions.isPrivate("unsetTask")).toBe(false);
    });

    it("treats an unregistered definition as not private", () => {
        const privateDefinitions = createPrivateTaskDefinitions([]);

        expect(privateDefinitions.getIds()).toEqual([]);
        expect(privateDefinitions.isPrivate("unknownTask")).toBe(false);
    });
});
