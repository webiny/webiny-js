import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import {
    GetContentEntriesGateway,
    GetContentEntriesUseCase
} from "~/features/contentEntry/getContentEntries/abstractions.js";
import { SearchContentEntriesUseCase } from "~/features/contentEntry/searchContentEntries/abstractions.js";
import type { CmsReferenceEntry } from "~/features/contentEntry/refTypes.js";
import { ReferenceTitles as Abstraction } from "./abstractions.js";
import { ReferenceTitlesFeature } from "./feature.js";

const createEntry = (modelId: string, entryId: string, title: string): CmsReferenceEntry => ({
    id: `${entryId}#0002`,
    entryId,
    status: "draft",
    title,
    description: null,
    image: null,
    createdOn: "2026-01-01T00:00:00.000Z",
    savedOn: "2026-01-01T00:00:00.000Z",
    createdBy: { id: "1", type: "admin", displayName: "Admin" },
    modifiedBy: null,
    model: { modelId, name: modelId },
    published: null,
    wbyAco_location: null
});

const entries = [
    createEntry("location", "baker", "Baker"),
    createEntry("location", "lincoln", "Lincoln Park"),
    createEntry("coach", "ana", "Ana")
];

const createContainer = () => {
    const gateway = vi.fn(async ({ entries: refs }: { entries: { id: string }[] }) => ({
        latest: entries.filter(e => refs.some(r => r.id.startsWith(e.entryId))),
        published: []
    }));
    const container = new Container();
    container.registerInstance(GetContentEntriesGateway, { execute: gateway });
    container.registerInstance(GetContentEntriesUseCase, {
        execute: async () => ({ latest: [entries[0]], published: [] })
    });
    container.registerInstance(SearchContentEntriesUseCase, {
        execute: async () => ({ data: [entries[1]] })
    });
    ReferenceTitlesFeature.register(container);
    return { container, gateway, titles: container.resolve(Abstraction) };
};

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe("ReferenceTitles", () => {
    it("loads every reference asked for in the same tick with one request", async () => {
        const { titles, gateway } = createContainer();

        expect(titles.getTitle({ modelId: "location", id: "baker#0001" })).toBeUndefined();
        expect(titles.getTitle({ modelId: "location", id: "lincoln#0001" })).toBeUndefined();
        expect(titles.getTitle({ modelId: "coach", id: "ana#0001" })).toBeUndefined();
        await tick();
        await tick();

        expect(gateway).toHaveBeenCalledTimes(1);
        expect(gateway.mock.calls[0][0].entries).toHaveLength(3);
        expect(titles.getTitle({ modelId: "location", id: "baker#0001" })).toBe("Baker");
        expect(titles.getTitle({ modelId: "coach", id: "ana#0001" })).toBe("Ana");
    });

    it("asks for a reference once, whichever revision it points at", async () => {
        const { titles, gateway } = createContainer();

        titles.getTitle({ modelId: "location", id: "baker#0001" });
        await tick();
        await tick();
        titles.getTitle({ modelId: "location", id: "baker#0001" });
        titles.getTitle({ modelId: "location", id: "baker#0003" });
        await tick();

        expect(gateway).toHaveBeenCalledTimes(1);
    });

    it("settles a reference to a deleted entry as an empty title", async () => {
        const { titles, gateway } = createContainer();

        titles.getTitle({ modelId: "location", id: "gone#0001" });
        await tick();
        await tick();

        expect(titles.getTitle({ modelId: "location", id: "gone#0001" })).toBe("");
        expect(gateway).toHaveBeenCalledTimes(1);
    });

    it("asks again after a failed request", async () => {
        const { titles, gateway } = createContainer();
        gateway.mockRejectedValueOnce(new Error("Network error"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

        titles.getTitle({ modelId: "location", id: "baker#0001" });
        await tick();
        await tick();
        expect(titles.getTitle({ modelId: "location", id: "baker#0001" })).toBeUndefined();
        await tick();
        await tick();

        expect(gateway).toHaveBeenCalledTimes(2);
        expect(titles.getTitle({ modelId: "location", id: "baker#0001" })).toBe("Baker");
        consoleError.mockRestore();
    });

    it("keeps titles of entries the reference inputs load, without a request of its own", async () => {
        const { container, titles, gateway } = createContainer();

        await container.resolve(GetContentEntriesUseCase).execute({ entries: [] });
        await container.resolve(SearchContentEntriesUseCase).execute({ modelIds: ["location"] });

        expect(titles.getTitle({ modelId: "location", id: "baker#0001" })).toBe("Baker");
        expect(titles.getTitle({ modelId: "location", id: "lincoln#0001" })).toBe("Lincoln Park");
        await tick();
        expect(gateway).not.toHaveBeenCalled();
    });
});
