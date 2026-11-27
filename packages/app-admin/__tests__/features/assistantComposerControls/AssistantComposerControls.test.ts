import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { AssistantComposerControls } from "~/features/assistantComposerControls/AssistantComposerControls.js";
import { AssistantComposerControls as Abstraction } from "~/features/assistantComposerControls/abstractions.js";

const setup = () => {
    const container = new Container();
    container.register(AssistantComposerControls).inSingletonScope();
    return container.resolve(Abstraction);
};

const control = (name: string, value: unknown) => ({ name, element: null, value: () => value });

describe("AssistantComposerControls", () => {
    it("removes only the controls the screen that leaves added", () => {
        const controls = setup();
        const page = controls.register([control("promptContext", { projectId: "velo" })]);
        controls.register([control("tone", "formal")]);

        controls.unregister(page);

        expect(controls.list().map(entry => entry.name)).toEqual(["tone"]);
        expect(controls.values()).toEqual({ tone: "formal" });
    });

    it("lets a newer screen's control take a name an older one uses", () => {
        const controls = setup();
        controls.register([control("promptContext", { projectId: "velo" })]);
        const drawer = controls.register([control("promptContext", { projectId: "trade" })]);

        expect(controls.values()).toEqual({ promptContext: { projectId: "trade" } });

        controls.unregister(drawer);

        expect(controls.values()).toEqual({ promptContext: { projectId: "velo" } });
    });
});
