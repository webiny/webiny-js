import { makeAutoObservable, toJS } from "mobx";
import type { IFormModel, IFormModelFactory, IFormVM } from "../abstractions.js";

export interface FormModelDemoVM {
    form: IFormVM;
    data: Record<string, unknown>;
    lastSubmitted: Record<string, unknown> | null;
    isSubmitting: boolean;
}

export class FormModelDemoPresenter {
    private form: IFormModel;
    private lastSubmitted: Record<string, unknown> | null = null;
    private isSubmitting = false;

    constructor(formFactory: IFormModelFactory) {
        this.form = formFactory.create({
            fields: fields => ({
                title: fields.text().label("Title").required("Title is required"),
                content: fields
                    .object()
                    .label("Content Block")
                    .required("Pick a template")
                    .templates([
                        {
                            id: "hero",
                            name: "Hero Banner",
                            fields: f => ({
                                heading: f.text().label("Heading").required("Required"),
                                image: f.text().label("Image URL"),
                                cta: f.text().label("Call To Action")
                            })
                        },
                        {
                            id: "text",
                            name: "Rich Text",
                            fields: f => ({
                                body: f.text().label("Body").required("Required")
                            })
                        },
                        {
                            id: "premium",
                            name: "Premium Widget",
                            visible: form => form.field("plan").getValue() === "enterprise",
                            fields: f => ({
                                config: f.text().label("Widget Config")
                            })
                        }
                    ]),
                plan: fields
                    .select()
                    .label("Plan")
                    .defaultValue("free")
                    .options([
                        { label: "Free", value: "free" },
                        { label: "Pro", value: "pro" },
                        { label: "Enterprise", value: "enterprise" }
                    ])
            })
        });

        makeAutoObservable(this);
    }

    get vm(): FormModelDemoVM {
        return {
            form: this.form.vm,
            data: toJS(this.form.getData()),
            lastSubmitted: this.lastSubmitted,
            isSubmitting: this.isSubmitting
        };
    }

    async submit(): Promise<void> {
        this.isSubmitting = true;
        try {
            const result = await this.form.submit<Record<string, unknown>>();
            if (result !== false) {
                this.lastSubmitted = toJS(result);
            }
        } finally {
            this.isSubmitting = false;
        }
    }

    reset(): void {
        this.form.reset();
        this.lastSubmitted = null;
    }
}
