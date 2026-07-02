import type { FormModel } from "webiny/admin/form";
import { makeAutoObservable, toJS } from "mobx";
import { createAbstraction, createFeature, FormModelFactory } from "webiny/admin";

export interface WizardFormVM {
    form: FormModel.FormVM;
    data: Record<string, unknown>;
}

class WizardFormPresenterImpl {
    private form: FormModel.Interface;

    constructor(formFactory: FormModelFactory.Interface) {
        this.form = formFactory.create({
            fields: fields => ({
                title: fields.text().label("Title").required("Title is required"),
                description: fields.text().label("Description").required("Description is required")
            }),
            layout: layout => [layout.row("title"), layout.row("description")]
        });

        makeAutoObservable(this);
    }

    get vm(): WizardFormVM {
        return {
            form: this.form.vm,
            data: toJS(this.form.getData())
        };
    }

    async submit(): Promise<Record<string, unknown> | false> {
        return this.form.submit();
    }

    reset(): void {
        this.form.reset();
    }
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}

export const WizardFormPresenter =
    createAbstraction<WizardFormPresenterImpl>("WizardFormPresenter");

export const WizardFormPresenterFeature = createFeature({
    name: "NewEntryWizardDemo",
    register(container) {
        container.register(
            WizardFormPresenter.createImplementation({
                implementation: WizardFormPresenterImpl,
                dependencies: [FormModelFactory]
            })
        );
    },
    resolve(container) {
        return { presenter: container.resolve(WizardFormPresenter) };
    }
});
