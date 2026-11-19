import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { SendTestMailUseCase } from "~/features/sendTestMail/abstractions.js";
import { TestMailGuard } from "~/presentation/testMail/abstractions.js";
import { TestMailPresenter as PresenterAbstraction } from "~/presentation/testMail/abstractions.js";
import { TestMailRuns } from "~/presentation/testMail/abstractions.js";
import { TestMailPresenter } from "~/presentation/testMail/TestMailPresenter.js";
import { TestMailStore } from "~/presentation/testMail/TestMailStore.js";

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

const setup = (guards: TestMailGuard.Interface[] = []) => {
    const sends: Deferred[] = [];

    const container = new Container();
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
    for (const guard of guards) {
        container.registerInstance(TestMailGuard, guard);
    }
    const store = new TestMailStore();
    container.registerInstance(TestMailRuns, store);
    container.register(TestMailPresenter).inSingletonScope();

    return { presenter: container.resolve(PresenterAbstraction), sends };
};

describe("TestMailPresenter", () => {
    it("fills in the signed-in user's address and runs with no transport form installed", async () => {
        const { presenter, sends } = setup();
        presenter.init();

        expect(presenter.vm.recipient).toBe("admin@webiny.com");
        expect(presenter.vm.disabledReason).toBeNull();

        const test = presenter.send();
        sends[0].resolve();
        await test;

        expect(presenter.vm.result).toMatchObject({ type: "success" });
    });

    it("is held back, and its result hidden, while a guard gives a reason", async () => {
        const guard = { reason: null as string | null, getDisabledReason: () => guard.reason };
        const { presenter, sends } = setup([guard]);
        presenter.init();
        const test = presenter.send();
        sends[0].resolve();
        await test;

        guard.reason = "Save your changes first. The test uses the saved settings.";

        expect(presenter.vm.disabledReason).toBe(guard.reason);
        expect(presenter.vm.result).toBeNull();

        guard.reason = null;

        expect(presenter.vm.disabledReason).toBeNull();
        expect(presenter.vm.result).toMatchObject({ type: "success" });
    });

    it("does not send while a guard holds the test", async () => {
        const reason = "Save your changes first. The test uses the saved settings.";
        const guard = { getDisabledReason: () => reason };
        const { presenter, sends } = setup([guard]);
        presenter.init();

        await presenter.send();

        expect(sends).toHaveLength(0);
        expect(presenter.vm.sending).toBe(false);
    });

    it("ignores a test that finishes after the screen was left and a new test started", async () => {
        const { presenter, sends } = setup();
        presenter.setRecipient("first@webiny.com");
        const firstTest = presenter.send();

        presenter.dispose();
        presenter.setRecipient("second@webiny.com");
        const secondTest = presenter.send();
        sends[0].reject(new Error("connect ETIMEDOUT"));
        await firstTest;

        expect(presenter.vm.sending).toBe(true);
        expect(presenter.vm.result).toBeNull();

        sends[1].resolve();
        await secondTest;

        expect(presenter.vm.sending).toBe(false);
        expect(presenter.vm.result).toMatchObject({ type: "success" });
        expect(presenter.vm.result?.message).toContain("second@webiny.com");
    });
});
