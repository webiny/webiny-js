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

const createFakeForm = () => ({
    vm: {},
    isDirty: false,
    submit: vi.fn(async () => ({ title: "Draft" })),
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

const setup = () => {
    const forms: ReturnType<typeof createFakeForm>[] = [];
    const create = deferred<any>();

    const container = new Container();
    container.registerInstance(FormModelFactory, {
        create: () => {
            const form = createFakeForm();
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
        execute: () => create.promise
    } as unknown as CreateEntryUseCase.Interface);

    // Not reached by the create path these tests exercise.
    for (const abstraction of [
        Confirmation,
        GetEntryUseCase,
        CreateRevisionFromUseCase,
        UpdateEntryUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        DeleteEntryUseCase,
        UpdateRevisionDescriptionUseCase
    ]) {
        container.registerInstance(abstraction as any, {});
    }
    container.register(ContentEntryFormPresenter);

    return { presenter: container.resolve(Abstraction), forms, create };
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
        const { presenter, create } = setup();
        presenter.newEntry();

        const saving = presenter.saveRevision();
        presenter.reset();
        create.reject(new Error("Value must be unique."));

        await expect(saving).resolves.toBe(false);
    });

    it("leaves a form built after the save started alone", async () => {
        const { presenter, forms, create } = setup();
        presenter.newEntry();

        const saving = presenter.saveRevision();
        presenter.newEntry();
        create.reject(new Error("Value must be unique."));

        await expect(saving).resolves.toBe(false);
        expect(forms).toHaveLength(2);
        expect(forms[0].setErrors).not.toHaveBeenCalled();
        expect(forms[1].setErrors).not.toHaveBeenCalled();
    });
});
