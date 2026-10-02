import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import {
    GetSingletonEntryUseCase,
    UpdateSingletonEntryUseCase
} from "~/features/contentEntry/singletonEntry/abstractions.js";
import { SingleEntryPresenter as Abstraction } from "./abstractions.js";
import { SingleEntryPresenter } from "./SingleEntryPresenter.js";

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
    let pendingUpdate = deferred<any>();

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
        getModel: () => ({ modelId: "settings", fields: [] })
    } as unknown as CmsModelContext.Interface);
    container.registerInstance(GetSingletonEntryUseCase, {
        execute: async () => ({ id: "settings#0001", values: { title: "Saved" } })
    } as unknown as GetSingletonEntryUseCase.Interface);
    container.registerInstance(UpdateSingletonEntryUseCase, {
        execute: () => pendingUpdate.promise
    } as unknown as UpdateSingletonEntryUseCase.Interface);
    container.register(SingleEntryPresenter);

    return {
        presenter: container.resolve(Abstraction),
        forms,
        nextUpdate: () => {
            pendingUpdate = deferred<any>();
            return pendingUpdate;
        }
    };
};

describe("SingleEntryPresenter.save", () => {
    it("puts a rejected save's errors on the form", async () => {
        const { presenter, forms, nextUpdate } = setup();
        await presenter.init();
        const update = nextUpdate();

        const saving = presenter.save();
        update.reject(new Error("Value must be unique."));

        await expect(saving).resolves.toBe(false);
        expect(forms[0].setErrors).toHaveBeenCalledTimes(1);
    });

    it("returns false instead of throwing when the form was disposed mid-save", async () => {
        const { presenter, nextUpdate } = setup();
        await presenter.init();
        const update = nextUpdate();

        const saving = presenter.save();
        presenter.dispose();
        update.reject(new Error("Value must be unique."));

        await expect(saving).resolves.toBe(false);
    });

    it("doesn't put a rejected save's errors on a form built after it started", async () => {
        const { presenter, forms, nextUpdate } = setup();
        await presenter.init();
        const update = nextUpdate();

        const saving = presenter.save();
        await presenter.init();
        update.reject(new Error("Value must be unique."));

        await expect(saving).resolves.toBe(false);
        expect(forms).toHaveLength(2);
        expect(forms[0].setErrors).not.toHaveBeenCalled();
        expect(forms[1].setErrors).not.toHaveBeenCalled();
    });

    it("doesn't overwrite a form built after a successful save started", async () => {
        const { presenter, forms, nextUpdate } = setup();
        await presenter.init();
        const update = nextUpdate();

        const saving = presenter.save();
        await presenter.init();
        const setDataCallsBefore = forms[1].setData.mock.calls.length;
        update.resolve({ id: "settings#0002", values: { title: "From the old save" } });

        await expect(saving).resolves.toBe(true);
        expect(forms[1].setData).toHaveBeenCalledTimes(setDataCallsBefore);
    });
});
