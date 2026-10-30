import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ContentEntriesCacheProvider as ContentEntriesCacheProviderAbstraction } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/ContentEntriesCacheProvider.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";
import { CmsWorkflowsCacheFeature } from "~/features/feature.js";
import { CmsReviewEntriesCacheProviderDecorator } from "./CmsReviewEntriesCacheProviderDecorator.js";

const CANCELLED: SystemWorkflowValue = {
    workflowId: "wf-1",
    reviewState: ReviewState.Cancelled,
    stepId: "step-1",
    stepName: "Legal review",
    stepState: StepState.InReview
};

interface CreateEntryParams {
    version?: number;
    title?: string;
    system?: ICmsEntryMetaWithReview["system"];
}

function createEntry(params: CreateEntryParams = {}): CmsContentEntry {
    const { version = 1, title = "Hello", system } = params;
    const meta: Record<string, unknown> = { title, status: "draft", version, locked: false };
    if (system !== undefined) {
        meta.system = system;
    }
    return {
        id: `entry-1#000${version}`,
        entryId: "entry-1",
        meta
    } as unknown as CmsContentEntry;
}

function readWorkflow(entry: CmsContentEntry | undefined): unknown {
    const meta: ICmsEntryMetaWithReview | undefined = entry?.meta;
    return meta?.system?.workflow;
}

let container: Container;

function getCache() {
    return container.resolve(ContentEntriesCacheProviderAbstraction).get("article");
}

function readEntry(): CmsContentEntry | undefined {
    return getCache().getItem(entry => entry.entryId === "entry-1");
}

beforeEach(() => {
    container = new Container();
    container.register(ContentEntriesCacheProvider).inSingletonScope();
    container.registerDecorator(CmsReviewEntriesCacheProviderDecorator);
    getCache().setItems([createEntry({ system: { workflow: CANCELLED } })]);
});

describe("CmsReviewEntriesCacheProviderDecorator", () => {
    it("keeps the cached workflow when a mutation returns the same revision without one", () => {
        getCache().addItems([createEntry({ title: "Edited" })]);

        const entry = readEntry();
        expect(entry?.meta.title).toBe("Edited");
        expect(readWorkflow(entry)).toEqual(CANCELLED);
    });

    it("keeps the cached workflow when the returned entry selects other system fields", () => {
        getCache().addItems([createEntry({ title: "Edited", system: {} })]);

        expect(readWorkflow(readEntry())).toEqual(CANCELLED);
    });

    it("takes the workflow the added entry carries, including no review", () => {
        getCache().addItems([createEntry({ system: { workflow: null } })]);

        expect(readWorkflow(readEntry())).toBeNull();
    });

    it("gives a new revision of the entry no workflow of the cached revision", () => {
        getCache().addItems([createEntry({ version: 2 })]);

        const entry = readEntry();
        expect(entry?.id).toBe("entry-1#0002");
        expect(readWorkflow(entry)).toBeUndefined();
    });

    it("adds an entry that is not cached unchanged", () => {
        getCache().clear();
        const added = createEntry({ title: "New" });

        getCache().addItems([added]);

        expect(readEntry()).toEqual(added);
    });

    it("hands every other cache call to the cached list", () => {
        getCache().removeItems(entry => entry.entryId === "entry-1");

        expect(getCache().count()).toBe(0);
        expect(getCache().hasItems()).toBe(false);
    });

    it("is registered by the CMS workflows cache feature", () => {
        container = new Container();
        container.register(ContentEntriesCacheProvider).inSingletonScope();
        CmsWorkflowsCacheFeature.register(container);
        getCache().setItems([createEntry({ system: { workflow: CANCELLED } })]);

        getCache().addItems([createEntry({ title: "Edited" })]);

        expect(readWorkflow(readEntry())).toEqual(CANCELLED);
    });
});
