import { makeAutoObservable, runInAction, computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { GetSettingsUseCase } from "~/features/getSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/saveSettings/abstractions.js";
import { SendTestMailUseCase } from "~/features/sendTestMail/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import {
    SettingsPresenter as Abstraction,
    type ISettingsPresenter,
    type ISettingsViewModel
} from "./abstractions.js";
import type { ITestMailResult } from "./abstractions.js";
import type { MailerSettingsSource, TransportSettings } from "~/types.js";

class SettingsPresenterImpl implements ISettingsPresenter {
    private loading = false;
    private saving = false;
    private source: MailerSettingsSource = null;
    private form: IFormModel;
    private testMailRecipient = "";
    private sendingTestMail = false;
    private testMailResult: ITestMailResult | null = null;

    constructor(
        private getSettingsUseCase: GetSettingsUseCase.Interface,
        private saveSettingsUseCase: SaveSettingsUseCase.Interface,
        private sendTestMailUseCase: SendTestMailUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private formModelFactory: FormModelFactory.Interface
    ) {
        this.form = this.buildForm(null);
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ISettingsViewModel {
        return {
            loading: this.loading,
            saving: this.saving,
            form: this.form.vm,
            source: this.source,
            editable: this.source !== "code",
            testMail: {
                recipient: this.testMailRecipient,
                sending: this.sendingTestMail,
                disabledReason: this.getTestMailDisabledReason(),
                result: this.getVisibleTestMailResult()
            }
        };
    }

    setTestMailRecipient(recipient: string): void {
        this.testMailRecipient = recipient;
    }

    async sendTestMail(): Promise<void> {
        const to = this.testMailRecipient.trim();

        this.setSendingTestMail(true);
        this.setTestMailResult(null);

        try {
            await this.sendTestMailUseCase.execute(to);
            this.setTestMailResult({
                type: "success",
                message: `The mail server accepted the message for ${to}. Check that inbox to confirm it arrived.`
            });
        } catch (e) {
            this.setTestMailResult({ type: "danger", message: e.message });
        } finally {
            this.setSendingTestMail(false);
        }
    }

    dispose(): void {
        this.testMailResult = null;
        this.sendingTestMail = false;
        this.testMailRecipient = "";
    }

    private setSendingTestMail(sending: boolean): void {
        this.sendingTestMail = sending;
    }

    private setTestMailResult(result: ITestMailResult | null): void {
        this.testMailResult = result;
    }

    /*
     * A result describes the saved settings. Once the form is edited it no longer describes what
     * is on screen, so it is hidden until the form matches the saved settings again.
     */
    private getVisibleTestMailResult(): ITestMailResult | null {
        if (this.form.vm.isDirty) {
            return null;
        }
        return this.testMailResult;
    }

    /*
     * The test runs against the settings stored on the server, not the ones in the form, so it
     * waits for unsaved edits rather than reporting on settings the user is no longer looking at.
     */
    private getTestMailDisabledReason(): string | null {
        if (this.saving) {
            return "Saving the settings.";
        }
        if (this.form.vm.isDirty) {
            return "Save your changes first. The test uses the saved settings.";
        }
        if (!this.testMailRecipient.trim()) {
            return "Enter a recipient.";
        }
        return null;
    }

    async load(): Promise<void> {
        runInAction(() => {
            this.loading = true;
            this.testMailResult = null;
        });

        try {
            const settings = await this.getSettingsUseCase.execute();

            runInAction(() => {
                this.source = settings.source ?? null;
                this.form = this.buildForm(this.source);
                this.form.setData({
                    host: settings.host,
                    port: settings.port,
                    user: settings.user,
                    from: settings.from,
                    replyTo: settings.replyTo
                });
                if (!this.testMailRecipient) {
                    this.testMailRecipient = this.identityContext.getIdentity().profile.email ?? "";
                }
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async save(): Promise<boolean> {
        // A test in flight reports on the settings it started with; saving under it would pin
        // that result on the new ones.
        if (this.sendingTestMail) {
            return false;
        }

        const data = await this.form.submit();
        if (!data) {
            return false;
        }

        runInAction(() => {
            this.saving = true;
            this.testMailResult = null;
        });

        try {
            const payload: TransportSettings = {
                host: data.host as string,
                port: data.port as number | undefined,
                user: data.user as string,
                from: data.from as string,
                replyTo: data.replyTo as string | undefined
            };

            if (data.password) {
                payload.password = data.password as string;
            }

            const saved = await this.saveSettingsUseCase.execute(payload);

            /*
             * What was just saved becomes the form's baseline, so the form is no longer dirty and
             * the test mail can run against it. The password field empties: it is write-only, and
             * leaving it blank on the next save keeps the stored one.
             */
            runInAction(() => {
                this.source = saved.source ?? "storage";
                this.form.setData({
                    host: saved.host,
                    port: saved.port,
                    user: saved.user,
                    from: saved.from,
                    replyTo: saved.replyTo,
                    password: ""
                });
            });
            return true;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    private buildForm(source: MailerSettingsSource): IFormModel {
        const isCodeManaged = source === "code";

        return this.formModelFactory.create({
            fields: fields => {
                const result: Record<string, any> = {
                    host: fields
                        .text()
                        .label("Hostname")
                        .required("Hostname is required.")
                        .disabled(isCodeManaged),
                    port: fields.number().label("Port").disabled(isCodeManaged),
                    user: fields
                        .text()
                        .label("User")
                        .required("User is required.")
                        .disabled(isCodeManaged),
                    from: fields
                        .text()
                        .label("Mail from")
                        .required("Mail from is required.")
                        .disabled(isCodeManaged),
                    replyTo: fields.text().label("Mail reply-to").disabled(isCodeManaged)
                };

                if (!isCodeManaged) {
                    result.password = fields.password().label("Password");
                }

                return result;
            },
            layout: layout => {
                const rows = [layout.row("host"), layout.row("port"), layout.row("user")];

                if (!isCodeManaged) {
                    rows.push(layout.row("password"));
                }

                rows.push(layout.row("from"), layout.row("replyTo"));

                return rows;
            }
        });
    }
}

export const SettingsPresenter = Abstraction.createImplementation({
    implementation: SettingsPresenterImpl,
    dependencies: [
        GetSettingsUseCase,
        SaveSettingsUseCase,
        SendTestMailUseCase,
        IdentityContext,
        FormModelFactory
    ]
});
