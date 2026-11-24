/**
 * @vitest-environment jsdom
 */
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { TestMailGuard } from "@webiny/app-mailer";
import { TestMailRuns } from "@webiny/app-mailer/presentation/testMail/abstractions.js";
import { TestMailState } from "@webiny/app-mailer/presentation/testMail/abstractions.js";
import { TestMailStore } from "@webiny/app-mailer/presentation/testMail/TestMailStore.js";
import { GetSettingsUseCase } from "~/admin/features/getSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/admin/features/saveSettings/abstractions.js";
import { SmtpSettingsPresenter as PresenterAbstraction } from "~/admin/presentation/SmtpSettings/abstractions.js";
import { SmtpSettingsPresenter } from "~/admin/presentation/SmtpSettings/SmtpSettingsPresenter.js";
import { SmtpTestMailGuard } from "~/admin/presentation/SmtpSettings/SmtpTestMailGuard.js";

const settings = { host: "smtp.webiny.com", user: "user", from: "a@webiny.com" };

/*
 * A class rather than a plain object: MobX copies a plain object it is given, and the test changes
 * `isDirty` on the instance the presenter holds.
 */
class FakeForm {
    vm = { isDirty: false };
    setData = vi.fn();
    submit = vi.fn(async () => settings);
}

const setup = () => {
    const form = new FakeForm();
    const save = vi.fn(async () => ({ ...settings, source: "storage" as const }));

    const container = new Container();
    container.registerInstance(GetSettingsUseCase, {
        execute: async () => settings
    } as unknown as GetSettingsUseCase.Interface);
    container.registerInstance(SaveSettingsUseCase, { execute: save });
    container.registerInstance(FormModelFactory, {
        create: () => form
    } as unknown as FormModelFactory.Interface);
    const store = new TestMailStore();
    container.registerInstance(TestMailState, store);
    container.registerInstance(TestMailRuns, store);
    container.register(SmtpSettingsPresenter).inSingletonScope();
    container.register(SmtpTestMailGuard).inSingletonScope();

    return {
        presenter: container.resolve(PresenterAbstraction),
        guard: container.resolve(TestMailGuard),
        testMail: container.resolve(TestMailRuns),
        form,
        save
    };
};

describe("SmtpSettingsPresenter", () => {
    it("holds the test email back while the form has unsaved changes", async () => {
        const { presenter, guard, form } = setup();
        await presenter.load();

        expect(guard.getDisabledReason()).toBeNull();

        form.vm.isDirty = true;

        expect(guard.getDisabledReason()).toBe(
            "Save your changes first. The test uses the saved settings."
        );
    });

    it("does not save while a test email is sending", async () => {
        const { presenter, testMail, save } = setup();
        testMail.start();

        expect(presenter.vm.testMailSending).toBe(true);
        const saved = await presenter.save();
        expect(saved).toBe(false);
        expect(save).not.toHaveBeenCalled();
    });

    it("drops the test result on save, since it described the old settings", async () => {
        const { presenter, testMail, save } = setup();
        const run = testMail.start();
        testMail.finish(run, { type: "success", message: "Accepted." });

        const saved = await presenter.save();
        expect(saved).toBe(true);
        expect(save).toHaveBeenCalledTimes(1);
        expect(testMail.result).toBeNull();
    });

    it("drops edits from an earlier visit as soon as the form loads again", async () => {
        const forms: FakeForm[] = [];
        let resolveSettings: (value: typeof settings) => void = () => {};

        const container = new Container();
        container.registerInstance(GetSettingsUseCase, {
            execute: () => new Promise(resolve => (resolveSettings = resolve))
        } as unknown as GetSettingsUseCase.Interface);
        container.registerInstance(SaveSettingsUseCase, { execute: vi.fn() });
        container.registerInstance(FormModelFactory, {
            create: () => {
                const form = new FakeForm();
                forms.push(form);
                return form;
            }
        } as unknown as FormModelFactory.Interface);
        const store = new TestMailStore();
        container.registerInstance(TestMailState, store);
        container.registerInstance(TestMailRuns, store);
        container.register(SmtpSettingsPresenter).inSingletonScope();
        const presenter = container.resolve(PresenterAbstraction);

        const firstVisit = presenter.load();
        resolveSettings(settings);
        await firstVisit;
        forms[forms.length - 1].vm.isDirty = true;
        expect(presenter.vm.form.isDirty).toBe(true);

        // Second visit: the stored settings have not arrived yet.
        const secondVisit = presenter.load();
        expect(presenter.vm.form.isDirty).toBe(false);

        resolveSettings(settings);
        await secondVisit;
    });
});
