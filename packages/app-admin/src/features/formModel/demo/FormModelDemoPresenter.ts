import { makeAutoObservable, toJS } from "mobx";
import type { IFormModel, IFormModelFactory, IFormVM } from "../abstractions.js";

export interface FormModelDemoVM {
    form: IFormVM;
    data: Record<string, unknown>;
    lastSubmitted: Record<string, unknown> | null;
    isSubmitting: boolean;
    runtimeTemplateAdded: boolean;
    textTemplateRemoved: boolean;
}

const RUNTIME_TEMPLATE_ID = "runtimeBanner";

export class FormModelDemoPresenter {
    private form: IFormModel;
    private lastSubmitted: Record<string, unknown> | null = null;
    private isSubmitting = false;
    private runtimeTemplateAdded = false;
    private textTemplateRemoved = false;

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
                                subheading: f.text().label("Subheading"),
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
                sections: fields
                    .object()
                    .label("Page Sections")
                    .list()
                    .templates([
                        {
                            id: "hero",
                            name: "Hero Banner",
                            fields: f => ({
                                heading: f.text().label("Heading").required("Required"),
                                subheading: f.text().label("Subheading"),
                                image: f.text().label("Image URL")
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
                            id: "cta",
                            name: "Call To Action",
                            fields: f => ({
                                label: f.text().label("Button Label").required("Required"),
                                url: f.text().label("Link URL")
                            })
                        }
                    ]),
                plan: fields
                    .text()
                    .label("Plan")
                    .defaultValue("free")
                    .options([
                        { label: "Free", value: "free" },
                        { label: "Pro", value: "pro" },
                        { label: "Enterprise", value: "enterprise" }
                    ])
            }),
            layout: layout => [
                layout.row("title"),
                layout.row("plan"),
                layout.object("content", {
                    hero: l => [l.row("heading", "subheading"), l.row("image"), l.row("cta")],
                    text: l => [l.row("body")]
                }),
                layout.object("sections", {
                    hero: l => [l.row("heading", "subheading"), l.row("image")],
                    cta: l => [l.row("label", "url")]
                })
            ]
        });

        makeAutoObservable(this);
    }

    get vm(): FormModelDemoVM {
        return {
            form: this.form.vm,
            data: toJS(this.form.getData()),
            lastSubmitted: this.lastSubmitted,
            isSubmitting: this.isSubmitting,
            runtimeTemplateAdded: this.runtimeTemplateAdded,
            textTemplateRemoved: this.textTemplateRemoved
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

    toggleRuntimeTemplate(): void {
        const sections = this.form.field("sections").as("object");
        if (this.runtimeTemplateAdded) {
            sections.templates.remove(RUNTIME_TEMPLATE_ID);
            this.runtimeTemplateAdded = false;
        } else {
            sections.templates.add({
                id: RUNTIME_TEMPLATE_ID,
                name: "Runtime Banner",
                fields: f => ({
                    headline: f.text().label("Headline").required("Required"),
                    note: f.text().label("Note")
                })
            });
            this.runtimeTemplateAdded = true;
        }
    }

    toggleTextTemplate(): void {
        const content = this.form.field("content").as("object");
        if (this.textTemplateRemoved) {
            content.templates.add({
                id: "text",
                name: "Rich Text",
                fields: f => ({
                    body: f.text().label("Body").required("Required")
                })
            });
            this.textTemplateRemoved = false;
        } else {
            content.templates.remove("text");
            this.textTemplateRemoved = true;
        }
    }
}
