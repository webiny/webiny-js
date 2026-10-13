import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { SearchContentEntriesUseCase } from "~/features/contentEntry/searchContentEntries/abstractions.js";
import { GetContentEntriesUseCase } from "~/features/contentEntry/getContentEntries/abstractions.js";
import type { CmsReferenceEntry } from "~/features/contentEntry/refTypes.js";
import { RefMultiAutocompletePresenter as MultiAbstraction } from "./multi/abstractions.js";
import { RefMultiAutocompletePresenter } from "./multi/RefMultiAutocompletePresenter.js";
import { RefSingleAutocompletePresenter as SingleAbstraction } from "./single/abstractions.js";
import { RefSingleAutocompletePresenter } from "./single/RefSingleAutocompletePresenter.js";

const createEntry = (entryId: string, title: string): CmsReferenceEntry => ({
    id: `${entryId}#0001`,
    entryId,
    status: "draft",
    title,
    description: null,
    image: null,
    createdOn: "2026-01-01T00:00:00.000Z",
    savedOn: "2026-01-01T00:00:00.000Z",
    createdBy: { id: "1", type: "admin", displayName: "Admin" },
    modifiedBy: null,
    model: { modelId: "location", name: "Location" },
    published: null,
    wbyAco_location: null
});

// The default list holds only the first entry, so the second one can only be found by searching.
const defaultEntry = createEntry("first", "First");
const searchedEntry = createEntry("second", "Second");

const createContainer = () => {
    const container = new Container();
    container.registerInstance(SearchContentEntriesUseCase, {
        execute: async ({ query }) => ({ data: query ? [searchedEntry] : [defaultEntry] })
    });
    container.registerInstance(GetContentEntriesUseCase, {
        execute: async () => ({ latest: [], published: [] })
    });
    return container;
};

describe("RefMultiAutocompletePresenter", () => {
    it("keeps an entry picked from the search results", async () => {
        const container = createContainer();
        container.register(RefMultiAutocompletePresenter);
        const presenter = container.resolve(MultiAbstraction);

        await presenter.init({ modelIds: ["location"] });
        await presenter.search("sec");

        const refs = presenter.select(["second"]);

        expect(refs).toEqual([{ id: "second#0001", modelId: "location" }]);
        expect(presenter.vm.values).toEqual(["second"]);
        expect(presenter.vm.options).toContainEqual({ label: "Second", value: "second" });
    });

    it("keeps earlier picks when another entry is picked from the search results", async () => {
        const container = createContainer();
        container.register(RefMultiAutocompletePresenter);
        const presenter = container.resolve(MultiAbstraction);

        await presenter.init({ modelIds: ["location"] });
        presenter.select(["first"]);
        await presenter.search("sec");

        const refs = presenter.select(["first", "second"]);

        expect(refs).toEqual([
            { id: "first#0001", modelId: "location" },
            { id: "second#0001", modelId: "location" }
        ]);
        expect(presenter.vm.values).toEqual(["first", "second"]);
    });

    it("ignores a search response that arrives after a newer one", async () => {
        const boulder = createEntry("boulder", "Boulder");
        const baker = createEntry("baker", "Baker");
        // The "B" request is slower than the "Boulder" one, and its first page does not hold Boulder.
        let resolveSlow: () => void = () => {};
        const slow = new Promise<void>(resolve => {
            resolveSlow = resolve;
        });

        const container = new Container();
        container.registerInstance(SearchContentEntriesUseCase, {
            execute: async ({ query }) => {
                if (query === "B") {
                    await slow;
                    return { data: [baker] };
                }
                return { data: query ? [boulder] : [defaultEntry] };
            }
        });
        container.registerInstance(GetContentEntriesUseCase, {
            execute: async () => ({ latest: [], published: [] })
        });
        container.register(RefMultiAutocompletePresenter);
        const presenter = container.resolve(MultiAbstraction);

        await presenter.init({ modelIds: ["location"] });
        const first = presenter.search("B");
        await presenter.search("Boulder");
        resolveSlow();
        await first;

        expect(presenter.vm.options).toEqual([{ label: "Boulder", value: "boulder" }]);
        expect(presenter.vm.loading).toBe(false);
    });
});

describe("RefSingleAutocompletePresenter", () => {
    it("keeps an entry picked from the search results", async () => {
        const container = createContainer();
        container.register(RefSingleAutocompletePresenter);
        const presenter = container.resolve(SingleAbstraction);

        await presenter.init({ modelIds: ["location"] });
        await presenter.search("sec");

        const ref = presenter.select("second");

        expect(ref).toEqual({ id: "second#0001", modelId: "location" });
        expect(presenter.vm.value).toBe("second");
    });
});
