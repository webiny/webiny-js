import { computed, makeAutoObservable } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import type { CmsModel } from "~/types.js";
import { ContentModelFormPreviewPresenter as Abstraction } from "./abstractions.js";

class ContentModelFormPreviewPresenterImpl implements Abstraction.Interface {
    private _form: FormModel.Interface | null = null;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private cmsFormModelBuilder: CmsFormModelBuilder.Interface
    ) {
        makeAutoObservable<
            ContentModelFormPreviewPresenterImpl,
            "formModelFactory" | "cmsFormModelBuilder"
        >(this, {
            formModelFactory: false,
            cmsFormModelBuilder: false,
            vm: computed
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            form: this._form?.vm ?? null
        };
    }

    buildForm(model: CmsModel): void {
        const formConfig = this.cmsFormModelBuilder.build(model);
        this._form = this.formModelFactory.create(formConfig);
    }

    reset(): void {
        this._form = null;
    }
}

export const ContentModelFormPreviewPresenterImplementation = Abstraction.createImplementation({
    implementation: ContentModelFormPreviewPresenterImpl,
    dependencies: [FormModelFactory, CmsFormModelBuilder]
});
