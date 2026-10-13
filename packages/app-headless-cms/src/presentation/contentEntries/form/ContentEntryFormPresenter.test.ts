// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { CreateEntryUseCase } from "~/features/contentEntry/createEntry/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/updateEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { ContentEntryFormPresenter as Abstraction } from "./abstractions.js";
import { ContentEntryFormPresenter } from "./ContentEntryFormPresenter.js";

const createFakeForm = (validation?: Promise<unknown>) => ({
    vm: {},
    isDirty: false,
    submit: vi.fn(async () => (validation ? validation : { title: "Draft" })),
    setData: vi.fn(),
    reset: vi.fn(),
    setErrors: vi.fn()
});

/** A promise the test settles by hand, so it can act while a save is still in flight. */
const deferred = <T>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const createEntry = (entryId: string) => ({
    id: `${entryId}#0001`,
    entryId,
    meta: { locked: false, status: "draft", title: entryId },
    values: { title: entryId }
});

const setup = () => {
    const forms: ReturnType<typeof createFakeForm>[] = [];
    const create = deferred<any>();
    const update = deferred<any>();
    /** When set, the next form built validates only once the test resolves this. */
    let nextValidation: Promise<unknown> | undefined;
    /** Entries whose load the test settles by hand. */
    const pendingLoads = new Map<string, Promise<any>>();

    const createExecute = vi.fn(() => create.promise);
    const updateExecute = vi.fn(() => update.promise);

    const container = new Container();
    container.registerInstance(FormModelFactory, {
        create: () => {
            const form = createFakeForm(nextValidation);
            nextValidation = undefined;
            forms.push(form);
            return form;
        }
    } as unknown as FormModelFactory.Interface);
    container.registerInstance(CmsFormModelBuilder, {
        build: () => ({})
    } as unknown as CmsFormModelBuilder.Interface);
    container.registerInstance(CmsModelContext, {
        getModel: () => ({ modelId: "article", fields: [] })
    } as unknown as CmsModelContext.Interface);
    container.registerInstance(CreateEntryUseCase, {
        execute: createExecute
    } as unknown as CreateEntryUseCase.Interface);
    container.registerInstance(UpdateEntryUseCase, {
        execute: updateExecute
    } as unknown as UpdateEntryUseCase.Interface);
    container.registerInstance(GetEntryUseCase, {
        execute: async ({ id }: { id: string }) => pendingLoads.get(id) ?? createEntry(id)
    } as unknown as GetEntryUseCase.Interface);

    // Not reached by the paths these tests exercise.
    for (const abstraction of [
        Confirmation,
        CreateRevisionFromUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        DeleteEntryUseCase,
        UpdateRevisionDescriptionUseCase
    ]) {
        container.registerInstance(abstraction as any, {});
    }
    container.register(ContentEntryFormPresenter);

    return {
        presenter: container.resolve(Abstraction),
        forms,
        create,
        createExecute,
        update,
        updateExecute,
        pendingLoads,
        slowValidation: () => {
            const validation = deferred<unknown>();
            nextValidation = validation.promise;
            return validation;
        }
    };
};

describe("ContentEntryFormPresenter.saveRevision", () => {
    it("puts a rejected save's errors on the form", async () => {
        const { presenter, forms, create } = setup();
        presenter.newEntry();

        const saving = presenter.saveRevision();
        create.reject(new Error("Value must be unique."));

        await expect(saving).resolves.toBe(false);
        expect(forms[0].setErrors).toHaveBeenCalledTimes(1);
    });

    it("returns false instead of throwing when the form was reset mid-save", async () => {
        const { presenter, create, createExecute } = setup();
        presenter.newEntry();

        const saving = presenter.saveRevision();
        await vi.waitFor(() => expect(createExecute).toHaveBeenCalled());
        presenter.reset();
        create.reject(new Error("Value must be unique."));

        await expect(saving).resolves.toBe(false);
        expect(presenter.vm.loading).toBe(null);
    });

    it("leaves a form built after the save started alone", async () => {
        const { presenter, forms, create, createExecute } = setup();
        presenter.newEntry();

        const saving = presenter.saveRevision();
        await vi.waitFor(() => expect(createExecute).toHaveBeenCalled());
        presenter.newEntry();
        create.reject(new Error("Value must be unique."));

        await expect(saving).resolves.toBe(false);
        expect(forms).toHaveLength(2);
        expect(forms[0].setErrors).not.toHaveBeenCalled();
        expect(forms[1].setErrors).not.toHaveBeenCalled();
    });

    it("saves the open entry and puts the saved values on the form", async () => {
        const { presenter, forms, update, updateExecute } = setup();
        await presenter.loadRevision("A");

        const saving = presenter.saveRevision();
        await vi.waitFor(() => expect(updateExecute).toHaveBeenCalled());
        update.resolve(createEntry("A"));

        await expect(saving).resolves.toBe(true);
        expect(updateExecute).toHaveBeenCalledWith(
            expect.objectContaining({ revisionId: "A#0001", data: { values: { title: "Draft" } } })
        );
        expect(forms[0].setData).toHaveBeenLastCalledWith({ title: "A" });
    });

    it("does not write to an entry opened while the form was validating", async () => {
        const { presenter, update, updateExecute, slowValidation } = setup();
        const validation = slowValidation();
        await presenter.loadRevision("A");

        const saving = presenter.saveRevision();
        await presenter.loadRevision("B");
        validation.resolve({ title: "Values typed into A" });
        // Settled up front, so a write that wrongly goes out finishes instead of hanging.
        update.resolve(createEntry("B"));

        await expect(saving).resolves.toBe(false);
        expect(updateExecute).not.toHaveBeenCalled();
        expect(presenter.vm.entry?.entryId).toBe("B");
    });

    it("keeps a write on its entry and reports false when another entry was opened", async () => {
        const { presenter, forms, update, updateExecute } = setup();
        await presenter.loadRevision("A");

        const saving = presenter.saveRevision();
        await vi.waitFor(() => expect(updateExecute).toHaveBeenCalled());
        await presenter.loadRevision("B");
        update.resolve(createEntry("A"));

        // False, so "Save & Publish" does not go on to publish B.
        await expect(saving).resolves.toBe(false);
        expect(updateExecute).toHaveBeenCalledTimes(1);
        expect(updateExecute).toHaveBeenCalledWith(
            expect.objectContaining({ revisionId: "A#0001" })
        );
        expect(presenter.vm.entry?.entryId).toBe("B");
        expect(forms[1].setData).toHaveBeenCalledTimes(1);
        expect(forms[1].setData).toHaveBeenCalledWith({ title: "B" });
    });

    it("does not clear the loading message of an entry being opened", async () => {
        const { presenter, update, updateExecute, pendingLoads } = setup();
        await presenter.loadRevision("A");

        const saving = presenter.saveRevision();
        await vi.waitFor(() => expect(updateExecute).toHaveBeenCalled());

        const loadB = deferred<any>();
        pendingLoads.set("B", loadB.promise);
        const loading = presenter.loadRevision("B");
        update.resolve(createEntry("A"));

        // A's form is still on screen, because B hasn't loaded yet.
        await expect(saving).resolves.toBe(true);
        expect(presenter.vm.loading).toBe("Loading entry...");

        loadB.resolve(createEntry("B"));
        await loading;
        expect(presenter.vm.loading).toBe(null);
    });
});
