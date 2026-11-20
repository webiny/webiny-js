import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { GetSettingsUseCase } from "~/features/getSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/saveSettings/abstractions.js";
import { SendTestMailUseCase } from "~/features/sendTestMail/abstractions.js";
import { SettingsPresenter as PresenterAbstraction } from "~/presentation/settings/abstractions.js";
import { SettingsPresenter } from "~/presentation/settings/SettingsPresenter.js";

interface Deferred {
    promise: Promise<void>;
    resolve: () => void;
    reject: (error: Error) => void;
}

const createDeferred = (): Deferred => {
    const deferred = {} as Deferred;
    deferred.promise = new Promise<void>((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
};

const setup = () => {
    const sends: Deferred[] = [];
    const form = {
        vm: { isDirty: false },
        setData: () => undefined,
        submit: async () => null
    };

    const container = new Container();
    container.registerInstance(GetSettingsUseCase, {
        execute: async () => ({ host: "smtp.webiny.com", user: "user", from: "a@webiny.com" })
    } as unknown as GetSettingsUseCase.Interface);
    container.registerInstance(SaveSettingsUseCase, {} as SaveSettingsUseCase.Interface);
    container.registerInstance(SendTestMailUseCase, {
        execute: () => {
            const deferred = createDeferred();
            sends.push(deferred);
            return deferred.promise;
        }
    });
    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ profile: { email: "admin@webiny.com" } })
    } as unknown as IdentityContext.Interface);
    container.registerInstance(FormModelFactory, {
        create: () => form
    } as unknown as FormModelFactory.Interface);
    container.register(SettingsPresenter).inSingletonScope();

    return { presenter: container.resolve(PresenterAbstraction), sends };
};

describe("SettingsPresenter", () => {
    it("ignores a test that finishes after the screen was left and a new test started", async () => {
        const { presenter, sends } = setup();
        presenter.setTestMailRecipient("first@webiny.com");
        const firstTest = presenter.sendTestMail();

        presenter.dispose();
        presenter.setTestMailRecipient("second@webiny.com");
        const secondTest = presenter.sendTestMail();
        sends[0].reject(new Error("connect ETIMEDOUT"));
        await firstTest;

        expect(presenter.vm.testMail.sending).toBe(true);
        expect(presenter.vm.testMail.result).toBeNull();

        sends[1].resolve();
        await secondTest;

        expect(presenter.vm.testMail.sending).toBe(false);
        expect(presenter.vm.testMail.result).toMatchObject({ type: "success" });
        expect(presenter.vm.testMail.result?.message).toContain("second@webiny.com");
    });
});
