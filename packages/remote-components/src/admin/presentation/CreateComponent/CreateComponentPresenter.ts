import { computed, makeAutoObservable, runInAction } from "mobx";
import {
    FormModelFactory,
    type IFormModel
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { CreateComponentPresenter as PresenterAbstraction } from "./abstractions.js";
import { RemoteComponentGateway } from "~/admin/features/shared/abstractions.js";

class CreateComponentPresenterImpl implements PresenterAbstraction.Interface {
    private _generating = false;
    private _createdId: string | null = null;
    private _error: string | null = null;
    private _form: IFormModel;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private gateway: RemoteComponentGateway.Interface
    ) {
        this._form = this.buildForm();
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            form: this._form.vm,
            generating: this._generating,
            createdId: this._createdId,
            error: this._error
        };
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                prompt: fields
                    .text()
                    .label("Describe the component")
                    .required("Description is required")
                    .renderer("textarea", { rows: 5 })
                    .placeholder(
                        "Mention layout, content slots, and anything editors should be able to change."
                    ),
                additionalFiles: fields.file().list().accept(["image/*"]).label("Reference images")
            }),
            layout: layout => [layout.row("prompt"), layout.row("additionalFiles")]
        });
    }

    async generate() {
        const data = await this._form.submit();
        if (!data) {
            return;
        }

        const prompt = data.prompt as string;
        const files = data.additionalFiles as Array<{ id: string }> | undefined;
        const additionalFileIds =
            files && files.length > 0 ? files.map(f => f.id).filter(Boolean) : undefined;

        runInAction(() => {
            this._generating = true;
            this._error = null;
        });

        try {
            await this.gateway.generate(prompt, {
                description: prompt,
                additionalFileIds
            });
        } catch (error) {
            runInAction(() => {
                this._error = (error as Error).message;
                this._generating = false;
            });
        }
    }

    processAiResponse(data: { id: string }) {
        runInAction(() => {
            this._createdId = data.id;
            this._generating = false;
        });
    }

    cancelGeneration() {
        runInAction(() => {
            this._generating = false;
        });
    }
}

export const CreateComponentPresenter = PresenterAbstraction.createImplementation({
    implementation: CreateComponentPresenterImpl,
    dependencies: [FormModelFactory, RemoteComponentGateway]
});
