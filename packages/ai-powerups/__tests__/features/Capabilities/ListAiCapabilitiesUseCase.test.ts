import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import {
    AiCapability,
    ListAiCapabilitiesUseCase
} from "~/api/features/Capabilities/abstractions.js";
import { ListAiCapabilitiesUseCaseImplementation } from "~/api/features/Capabilities/ListAiCapabilitiesUseCase.js";

class WithGuidance implements AiCapability.Interface {
    readonly id = "cms.compareEntryRevisions";
    readonly label = "CMS revision comparison";
    readonly description = "For tests.";
    readonly defaultRole = "fast" as const;
    readonly guidance = "Webiny's own prompt, which must not leave the api.";
}

class WithoutGuidance implements AiCapability.Interface {
    readonly id = "cms.generateEntry";
    readonly label = "CMS entry generation";
    readonly description = "For tests.";
    readonly defaultRole = "standard" as const;
}

function useCase(...capabilities: Array<new () => AiCapability.Interface>) {
    const container = new Container();

    for (const implementation of capabilities) {
        container.register(AiCapability.createImplementation({ implementation, dependencies: [] }));
    }
    container.register(ListAiCapabilitiesUseCaseImplementation);

    return container.resolve(ListAiCapabilitiesUseCase);
}

describe("ListAiCapabilitiesUseCase", () => {
    it("returns every registered capability", async () => {
        const result = await useCase(WithGuidance, WithoutGuidance).execute();

        expect(result.map(c => c.id)).toEqual(
            expect.arrayContaining(["cms.compareEntryRevisions", "cms.generateEntry"])
        );
    });

    it("returns the fields the settings screen renders a row from", async () => {
        const result = await useCase(WithoutGuidance).execute();

        expect(result[0]).toEqual({
            id: "cms.generateEntry",
            label: "CMS entry generation",
            description: "For tests.",
            defaultRole: "standard"
        });
    });

    /*
     * A capability's prompt is implementation, not settings. There is no reason to ship ours to
     * everyone who can read the settings screen, and the summary has no field for it.
     */
    it("never exposes a capability's guidance", async () => {
        const result = await useCase(WithGuidance).execute();

        expect(result[0]).not.toHaveProperty("guidance");
        expect(JSON.stringify(result)).not.toContain("must not leave the api");
    });

    it("returns an empty list when nothing is registered", async () => {
        const container = new Container();
        container.register(ListAiCapabilitiesUseCaseImplementation);

        expect(await container.resolve(ListAiCapabilitiesUseCase).execute()).toEqual([]);
    });
});
