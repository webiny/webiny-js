import { TestMailGuard } from "@webiny/app-mailer";
import { SmtpSettingsPresenter } from "./abstractions.js";

/*
 * The test runs against the settings stored on the server, not the ones in the form, so it waits
 * for unsaved edits rather than reporting on settings the user is no longer looking at.
 */
class SmtpTestMailGuardImpl implements TestMailGuard.Interface {
    constructor(private presenter: SmtpSettingsPresenter.Interface) {}

    getDisabledReason(): string | null {
        const { vm } = this.presenter;
        if (vm.saving) {
            return "Saving the settings.";
        }
        if (vm.form.isDirty) {
            return "Save your changes first. The test uses the saved settings.";
        }
        return null;
    }
}

export const SmtpTestMailGuard = TestMailGuard.createImplementation({
    implementation: SmtpTestMailGuardImpl,
    dependencies: [SmtpSettingsPresenter]
});
