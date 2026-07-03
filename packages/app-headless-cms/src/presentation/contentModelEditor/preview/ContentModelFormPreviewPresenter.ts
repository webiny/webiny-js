import { computed, makeAutoObservable } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import type { CmsModel } from "~/types.js";
import { ContentModelFormPreviewPresenter as Abstraction } from "./abstractions.js";

class ContentModelFormPreviewPresenterImpl implements Abstraction.Interface {
    private form: FormModel.Interface | null = null;

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
            form: this.form?.vm ?? null
        };
    }

    buildForm(model: CmsModel): void {
        const formConfig = this.cmsFormModelBuilder.build(model);
        this.form = this.formModelFactory.create(formConfig);
    }

    reset(): void {
        this.form = null;
    }
}

export const ContentModelFormPreviewPresenter = Abstraction.createImplementation({
    implementation: ContentModelFormPreviewPresenterImpl,
    dependencies: [FormModelFactory, CmsFormModelBuilder]
});
