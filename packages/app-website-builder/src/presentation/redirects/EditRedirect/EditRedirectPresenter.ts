import { makeAutoObservable, runInAction, computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { UpdateRedirectUseCase } from "~/features/redirects/updateRedirect/abstractions.js";
import { GetRedirectUseCase } from "~/features/redirects/getRedirect/abstractions.js";
import type { RedirectDto } from "~/domain/Redirect/RedirectDto.js";
import {
    EditRedirectPresenter as Abstraction,
    type IEditRedirectPresenter,
    type IEditRedirectViewModel
} from "./abstractions.js";

class EditRedirectPresenterImpl implements IEditRedirectPresenter {
    private _redirect: RedirectDto | null = null;
    private _loading: string | null = null;
    private _form: IFormModel;

    constructor(
        private updateRedirectUseCase: UpdateRedirectUseCase.Interface,
        private getRedirectUseCase: GetRedirectUseCase.Interface,
        private formModelFactory: FormModelFactory.Interface
    ) {
        this._form = this.buildForm();
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IEditRedirectViewModel {
        return {
            redirect: this._redirect,
            loading: this._loading,
            form: this._form.vm
        };
    }

    async loadRedirect(redirectId: string): Promise<void> {
        runInAction(() => {
            this._loading = "Loading redirect...";
        });

        try {
            const redirect = this.getRedirectUseCase.execute({ id: redirectId });
            runInAction(() => {
                this._redirect = redirect ?? null;
                this._form = this.buildForm();
                if (redirect) {
                    this._form.setData({
                        redirectFrom: redirect.redirectFrom,
                        redirectTo: redirect.redirectTo,
                        redirectType: redirect.redirectType,
                        isEnabled: redirect.isEnabled
                    });
                }
            });
        } finally {
            runInAction(() => {
                this._loading = null;
            });
        }
    }

    async save(): Promise<boolean> {
        if (!this._redirect) {
            return false;
        }

        const data = await this._form.submit<{
            redirectFrom: string;
            redirectTo: string;
            redirectType: string;
            isEnabled: boolean;
        }>();

        if (!data) {
            return false;
        }

        runInAction(() => {
            this._loading = "Saving changes...";
        });

        try {
            await this.updateRedirectUseCase.execute({
                id: this._redirect.id,
                redirectFrom: data.redirectFrom,
                redirectTo: data.redirectTo,
                redirectType: data.redirectType,
                isEnabled: data.isEnabled ?? false
            });
            return true;
        } finally {
            runInAction(() => {
                this._loading = null;
            });
        }
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                redirectFrom: fields
                    .text()
                    .label("Redirect From")
                    .required("This field is required"),
                redirectTo: fields.text().label("Redirect To").required("This field is required"),
                redirectType: fields
                    .text()
                    .label("Redirect Type")
                    .required("This field is required")
                    .defaultValue("permanent")
                    .options([
                        { label: "Permanent", value: "permanent" },
                        { label: "Temporary", value: "temporary" }
                    ]),
                isEnabled: fields.boolean().label("Is Enabled?")
            }),
            layout: layout => [
                layout.row("redirectFrom"),
                layout.row("redirectTo"),
                layout.row("redirectType"),
                layout.row("isEnabled")
            ]
        });
    }
}

export const EditRedirectPresenter = Abstraction.createImplementation({
    implementation: EditRedirectPresenterImpl,
    dependencies: [UpdateRedirectUseCase, GetRedirectUseCase, FormModelFactory]
});
