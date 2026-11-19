import { makeAutoObservable } from "mobx";
import { computed } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { SendTestMailUseCase } from "~/features/sendTestMail/abstractions.js";
import { TestMailPresenter as Abstraction } from "./abstractions.js";
import { TestMailGuard } from "./abstractions.js";
import { TestMailRuns } from "./abstractions.js";
import type { ITestMailResult } from "./abstractions.js";

class TestMailPresenterImpl implements Abstraction.Interface {
    private recipient = "";

    constructor(
        private sendTestMailUseCase: SendTestMailUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private state: TestMailRuns.Interface,
        private guards: TestMailGuard.Interface[]
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): Abstraction.ViewModel {
        const guardReason = this.getGuardReason();

        return {
            recipient: this.recipient,
            sending: this.state.sending,
            disabledReason: this.getDisabledReason(),
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
        if (this.state.sending || this.getDisabledReason()) {
            return;
        }

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

    private getDisabledReason(): string | null {
        const guardReason = this.getGuardReason();
        if (guardReason) {
            return guardReason;
        }
        if (!this.recipient.trim()) {
            return "Enter a recipient.";
        }
        return null;
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
        TestMailRuns,
        [TestMailGuard, { multiple: true }]
    ]
});
