import { makeAutoObservable, computed } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { SendTestMailUseCase } from "~/features/sendTestMail/abstractions.js";
import {
    TestMailPresenter as Abstraction,
    TestMailGuard,
    TestMailState,
    type ITestMailResult
} from "./abstractions.js";

class TestMailPresenterImpl implements Abstraction.Interface {
    private recipient = "";

    constructor(
        private sendTestMailUseCase: SendTestMailUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private state: TestMailState.Interface,
        private guards: TestMailGuard.Interface[]
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): Abstraction.ViewModel {
        const guardReason = this.getGuardReason();

        return {
            recipient: this.recipient,
            sending: this.state.sending,
            disabledReason: guardReason ?? (this.recipient.trim() ? null : "Enter a recipient."),
            // A result describes the saved settings, so it is hidden while a guard holds the test.
            result: guardReason ? null : this.state.result
        };
    }

    init(): void {
        if (!this.recipient) {
            this.recipient = this.identityContext.getIdentity().profile.email ?? "";
        }
    }

    setRecipient(recipient: string): void {
        this.recipient = recipient;
    }

    async send(): Promise<void> {
        const to = this.recipient.trim();
        const run = this.state.start();

        let result: ITestMailResult;
        try {
            await this.sendTestMailUseCase.execute(to);
            result = {
                type: "success",
                message: `The mail server accepted the message for ${to}. Check that inbox to confirm it arrived.`
            };
        } catch (e) {
            result = {
                type: "danger",
                message: `The test email was not sent. ${e.message}`
            };
        }

        this.state.finish(run, result);
    }

    dispose(): void {
        this.state.reset();
        this.recipient = "";
    }

    private getGuardReason(): string | null {
        for (const guard of this.guards) {
            const reason = guard.getDisabledReason();
            if (reason) {
                return reason;
            }
        }
        return null;
    }
}

export const TestMailPresenter = Abstraction.createImplementation({
    implementation: TestMailPresenterImpl,
    dependencies: [
        SendTestMailUseCase,
        IdentityContext,
        TestMailState,
        [TestMailGuard, { multiple: true }]
    ]
});
