/**
 * @vitest-environment jsdom
 */
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsContentEntry } from "~/types.js";
import type { CmsModel } from "~/types.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { CreateEntryUseCase } from "~/features/contentEntry/createEntry/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/updateEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import { ContentEntryFormPresenter as Abstraction } from "./abstractions.js";
import { ContentEntryFormPresenter } from "./ContentEntryFormPresenter.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

const ENTRY = {
    id: "entry-1#0001",
    entryId: "entry-1",
    values: {},
    meta: { title: "Entry 1", locked: false, status: "draft" }
} as unknown as CmsContentEntry;

async function setup(deleteEntry: () => Promise<boolean>) {
    const container = new Container();
    const form = { setData: vi.fn(), reset: vi.fn(), vm: {}, isDirty: false };

    container.registerInstance(FormModelFactory, {
        create: vi.fn(() => form)
    } as unknown as FormModelFactory.Interface);
    container.registerInstance(CmsFormModelBuilder, {
        build: vi.fn(() => ({}))
    } as unknown as CmsFormModelBuilder.Interface);
    container.registerInstance(Confirmation, {
        confirm: vi.fn(
            async (
                _name: string,
                _params: unknown,
                execute?: (data: unknown) => Promise<unknown>
            ) => (execute ? execute(undefined) : undefined)
        )
    } as unknown as Confirmation.Interface);
    container.registerInstance(CmsModelContext, { getModel: () => MODEL, setModel: vi.fn() });
    container.registerInstance(GetEntryUseCase, { execute: vi.fn(async () => ENTRY) });
    container.registerInstance(CreateEntryUseCase, { execute: vi.fn() });
    container.registerInstance(CreateRevisionFromUseCase, { execute: vi.fn() });
    container.registerInstance(UpdateEntryUseCase, { execute: vi.fn() });
    container.registerInstance(PublishEntryUseCase, { execute: vi.fn() });
    container.registerInstance(UnpublishEntryUseCase, { execute: vi.fn() });
    container.registerInstance(DeleteEntryUseCase, { execute: vi.fn(deleteEntry) });
    container.registerInstance(UpdateRevisionDescriptionUseCase, { execute: vi.fn() });
    container.register(ContentEntryFormPresenter).inSingletonScope();

    const presenter = container.resolve(Abstraction);
    await presenter.loadRevision("entry-1#0001");
    return presenter;
}

describe("ContentEntryFormPresenter.deleteEntry", () => {
    it("clears the entry and the form after a successful trash", async () => {
        const presenter = await setup(async () => true);
        expect(presenter.vm.entry).not.toBeNull();

        const result = await presenter.deleteEntry();

        expect(result).toBe(true);
        expect(presenter.vm.entry).toBeNull();
        expect(presenter.vm.form).toBeNull();
    });

    it("keeps the entry and the form and returns false when the use case returns false (warning dismissed)", async () => {
        const presenter = await setup(async () => false);

        const result = await presenter.deleteEntry();

        expect(result).toBe(false);
        expect(presenter.vm.entry).not.toBeNull();
        expect(presenter.vm.canDelete).toBe(true);
    });

    it("keeps the entry and returns false when the use case throws", async () => {
        const presenter = await setup(async () => {
            throw new Error("Network down");
        });

        const result = await presenter.deleteEntry();

        expect(result).toBe(false);
        expect(presenter.vm.entry).not.toBeNull();
    });
});
