import { makeAutoObservable, runInAction, computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CreateRedirectUseCase } from "~/features/redirects/createRedirect/abstractions.js";
import {
    CreateRedirectPresenter as Abstraction,
    type ICreateRedirectPresenter,
    type ICreateRedirectViewModel
} from "./abstractions.js";

class CreateRedirectPresenterImpl implements ICreateRedirectPresenter {
    private _loading: string | null = null;
    private _form: IFormModel;
    private _folderId = "root";

    constructor(
        private createRedirectUseCase: CreateRedirectUseCase.Interface,
        private formModelFactory: FormModelFactory.Interface
    ) {
        this._form = this.buildForm();
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ICreateRedirectViewModel {
        return {
            loading: this._loading,
            form: this._form.vm
        };
    }

    init(folderId: string): void {
        this._folderId = folderId;
        this._form = this.buildForm();
        this._loading = null;
    }

    async save(): Promise<boolean> {
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
            this._loading = "Creating redirect...";
        });

        try {
            await this.createRedirectUseCase.execute({
                location: { folderId: this._folderId },
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

export const CreateRedirectPresenter = Abstraction.createImplementation({
    implementation: CreateRedirectPresenterImpl,
    dependencies: [CreateRedirectUseCase, FormModelFactory]
});
