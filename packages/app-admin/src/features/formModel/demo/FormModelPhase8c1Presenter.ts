import { makeAutoObservable, toJS } from "mobx";
import type { IFormModel, IFormModelFactory, IFormVM } from "../abstractions.js";

export interface FormModelPhase8c1VM {
    form: IFormVM;
    data: Record<string, unknown>;
    lastSubmitted: Record<string, unknown> | null;
    isSubmitting: boolean;
}

/**
 * Demo presenter exercising Phase 8c.1: nested object layouts. The form has a
 * top-level `page` object whose inner layout contains tabs, and one of those
 * tabs contains a nested `seo` object with its own row layout. The Phase 8c.1
 * registrar walks the inner layout (including tabs) and forwards the nested
 * `layout.object("seo", ...)` to the seo field at build time.
 */
export class FormModelPhase8c1Presenter {
    private form: IFormModel;
    private lastSubmitted: Record<string, unknown> | null = null;
    private isSubmitting = false;

    constructor(formFactory: IFormModelFactory) {
        this.form = formFactory.create({
            fields: fields => ({
                page: fields
                    .object()
                    .label("Page")
                    .fields(f => ({
                        title: f.text().label("Title").defaultValue("Welcome"),
                        slug: f.text().label("Slug").defaultValue("welcome"),
                        seo: f
                            .object()
                            .label("SEO")
                            .fields(g => ({
                                metaTitle: g.text().label("Meta title"),
                                metaDescription: g.text().label("Meta description"),
                                og: g
                                    .object()
                                    .label("Open Graph")
                                    .fields(h => ({
                                        ogTitle: h.text().label("OG title"),
                                        ogImage: h.text().label("OG image URL")
                                    }))
                            })),
                        body: f.text().label("Body content")
                    }))
            }),
            layout: layout => [
                layout.object("page", l => [
                    l
                        .tabs("pageTabs")
                        .tab("general", tab => {
                            tab.label("General").layout(l => [
                                l.row("title", "slug"),
                                l.row("body")
                            ]);
                        })
                        .tab("seo", tab => {
                            tab.label("SEO").layout(l => [
                                l.object("seo", inner => [
                                    inner.row("metaTitle"),
                                    inner.row("metaDescription"),
                                    inner.object("og", og => [og.row("ogTitle", "ogImage")])
                                ])
                            ]);
                        })
                ])
            ]
        });

        makeAutoObservable(this);
    }

    get vm(): FormModelPhase8c1VM {
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
