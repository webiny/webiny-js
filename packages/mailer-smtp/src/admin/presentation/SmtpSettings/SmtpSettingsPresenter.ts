import { makeAutoObservable } from "mobx";
import { runInAction } from "mobx";
import { computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { TestMailState } from "@webiny/app-mailer";
import { GetSettingsUseCase } from "~/admin/features/getSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/admin/features/saveSettings/abstractions.js";
import { SmtpSettingsPresenter as Abstraction } from "./abstractions.js";
import type { MailerSettings } from "~/admin/types.js";
import type { MailerSettingsSource } from "~/admin/types.js";
import type { TransportSettings } from "~/admin/types.js";

class SmtpSettingsPresenterImpl implements Abstraction.Interface {
    private loading = false;
    private saving = false;
    private source: MailerSettingsSource = null;
    private form: IFormModel;

    constructor(
        private getSettingsUseCase: GetSettingsUseCase.Interface,
        private saveSettingsUseCase: SaveSettingsUseCase.Interface,
        private testMailState: TestMailState.Interface,
        private formModelFactory: FormModelFactory.Interface
    ) {
        this.form = this.buildForm(null);
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): Abstraction.ViewModel {
        return {
            loading: this.loading,
            saving: this.saving,
            form: this.form.vm,
            source: this.source,
            editable: this.source !== "code",
            testMailSending: this.testMailState.sending
        };
    }

    async load(): Promise<void> {
        /*
         * The presenter is a singleton, so a fresh form drops edits left over from an earlier
         * visit before the stored settings arrive.
         */
        runInAction(() => {
            this.loading = true;
            this.form = this.buildForm(this.source);
        });

        try {
            const settings = await this.getSettingsUseCase.execute();

            runInAction(() => {
                this.source = settings.source ?? null;
                this.form = this.buildForm(this.source);
                this.applySettings(settings);
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async save(): Promise<boolean> {
        /*
         * A test in flight reports on the settings it started with; saving under it would pin
         * that result on the new ones.
         */
        if (this.testMailState.sending) {
            return false;
        }

        const data = await this.form.submit();
        if (!data) {
            return false;
        }

        runInAction(() => {
            this.saving = true;
            this.testMailState.clearResult();
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
             * the test mail can run against it.
             */
            runInAction(() => {
                this.source = saved.source ?? "storage";
                this.applySettings(saved);
            });
            return true;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    /*
     * Sets the form's data and its baseline for `isDirty`. The password field empties: it is
     * write-only, and leaving it blank on the next save keeps the stored one.
     */
    private applySettings(settings: MailerSettings): void {
        this.form.setData({
            host: settings.host,
            port: settings.port,
            user: settings.user,
            from: settings.from,
            replyTo: settings.replyTo,
            password: ""
        });
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

export const SmtpSettingsPresenter = Abstraction.createImplementation({
    implementation: SmtpSettingsPresenterImpl,
    dependencies: [GetSettingsUseCase, SaveSettingsUseCase, TestMailState, FormModelFactory]
});
