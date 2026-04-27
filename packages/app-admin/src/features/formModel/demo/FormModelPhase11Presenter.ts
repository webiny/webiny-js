import { makeAutoObservable, toJS } from "mobx";
import { z } from "zod";
import type { IFormModel, IFormModelFactory, IFormVM } from "../abstractions.js";

export interface FormModelPhase11VM {
    form: IFormVM;
    data: Record<string, unknown>;
    lastSubmitted: Record<string, unknown> | null;
    isSubmitting: boolean;
    formErrors: { path: string; message: string }[];
}

/**
 * Demo presenter exercising Phase 11 features: requiredWhen (builder + modifier
 * chaining), computed/computedUntilDirty, .extend() on object fields, form-level
 * addRule (Zod + imperative), and setLayout.
 */
export class FormModelPhase11Presenter {
    private form: IFormModel;
    private lastSubmitted: Record<string, unknown> | null = null;
    private isSubmitting = false;

    constructor(formFactory: IFormModelFactory) {
        this.form = formFactory.create({
            fields: fields => ({
                first: fields.text().label("First name").defaultValue("Ada"),
                last: fields.text().label("Last name").defaultValue("Lovelace"),
                fullName: fields
                    .text()
                    .label("Full name (computed)")
                    .computed(f => `${f.field("first").getValue()} ${f.field("last").getValue()}`),
                slug: fields
                    .text()
                    .label("Slug (computed until you edit it)")
                    .computedUntilDirty(f => {
                        const full = `${f.field("first").getValue()} ${f.field("last").getValue()}`;
                        return full.trim().toLowerCase().replace(/\s+/g, "-");
                    }),
                plan: fields
                    .text()
                    .label("Plan")
                    .defaultValue("free")
                    .options([
                        { label: "Free", value: "free" },
                        { label: "Pro", value: "pro" },
                        { label: "Enterprise", value: "enterprise" }
                    ]),
                seats: fields
                    .text()
                    .label("Number of seats")
                    .help("Required when plan is pro or enterprise")
                    .requiredWhen(
                        f => f.field("plan").getValue() === "pro",
                        "Pro plan needs a seat count"
                    ),
                profile: fields
                    .object()
                    .label("Profile")
                    .fields(f => ({
                        title: f.text().label("Title")
                    })),
                password: fields.text().label("Password"),
                confirm: fields.text().label("Confirm password")
            })
        });

        // Modifier-style: add children to the existing "profile" object field.
        this.form
            .field("profile")
            .as("object")
            .fields(f => ({
                company: f.text().label("Company"),
                bio: f.text().label("Short bio")
            }));

        // Modifier-style requiredWhen: chains with the builder-defined one above.
        // First truthy callback wins.
        this.form
            .field("seats")
            .addRequiredWhen(
                f => f.field("plan").getValue() === "enterprise",
                "Enterprise plan needs a seat count too"
            );

        // Form-level Zod rule: confirm must match password.
        this.form.addRule(
            z
                .object({
                    password: z.string(),
                    confirm: z.string()
                })
                .refine(d => d.password === d.confirm || (!d.password && !d.confirm), {
                    message: "Passwords must match",
                    path: ["confirm"]
                })
        );

        // Imperative form-level rule.
        this.form.addRule(f => {
            const slug = String(f.field("slug").getValue() ?? "");
            if (slug.length > 0 && slug.length < 3) {
                return [{ path: "slug", message: "Slug must be at least 3 characters" }];
            }
            return [];
        });

        // setLayout — full replacement.
        this.form.setLayout(layout => [
            layout.row("first", "last"),
            layout.row("fullName"),
            layout.row("slug"),
            layout.separator(),
            layout.row("plan", "seats"),
            layout.separator(),
            layout.object("profile", l => [l.row("title"), l.row("company"), l.row("bio")]),
            layout.separator(),
            layout.row("password", "confirm")
        ]);

        makeAutoObservable(this);
    }

    get vm(): FormModelPhase11VM {
        return {
            form: this.form.vm,
            data: toJS(this.form.getData()),
            lastSubmitted: this.lastSubmitted,
            isSubmitting: this.isSubmitting,
            formErrors: this.form.errors.map(e => ({
                path: e.path,
                message: e.message
            }))
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
