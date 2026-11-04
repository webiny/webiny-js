import { computed, makeAutoObservable, runInAction } from "mobx";
import type { IFormModel, IFormModelFactory } from "@webiny/app-admin";
import { FormModelFactory } from "@webiny/app-admin";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import {
    type CreateLayoutData,
    CreateLayoutUseCase,
    getLayoutErrorMessage
} from "~/features/layouts/index.js";
import {
    CreateLayoutFormModifier,
    CreateLayoutPresenter as PresenterAbstraction
} from "./abstractions.js";
import { LayoutSlug } from "~/shared/LayoutSlug.js";

class CreateLayoutPresenterImpl implements PresenterAbstraction.Interface {
    /** Built by `init()`, never the constructor — see `CreatePagePresenter`. */
    private form: IFormModel | null = null;
    private loading = false;
    // The slug last filled in from the title.
    private filledSlug = "";

    constructor(
        private factory: IFormModelFactory,
        private modifiers: CreateLayoutFormModifier.Interface[],
        private createLayout: CreateLayoutUseCase.Interface,
        private notifications: Notifications.Interface
    ) {
        makeAutoObservable<
            CreateLayoutPresenterImpl,
            "factory" | "modifiers" | "createLayout" | "notifications" | "filledSlug" | "fillSlug"
        >(
            this,
            {
                vm: computed,
                factory: false,
                modifiers: false,
                createLayout: false,
                notifications: false,
                filledSlug: false,
                fillSlug: false
            },
            { autoBind: true }
        );
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            form: this.form ? this.form.vm : null,
            loading: this.loading
        };
    }

    init() {
        this.loading = false;
        this.filledSlug = "";
        this.form = this.buildForm();
    }

    async submit() {
        if (!this.form) {
            return null;
        }
        const data = await this.form.submit();
        if (!data) {
            return null;
        }

        const input: CreateLayoutData = {
            title: String(data.title ?? "").trim(),
            slug: LayoutSlug.fromInput(data.slug).complete().toString()
        };

        // Let cross-cutting modifiers map their form data.
        for (const modifier of this.modifiers) {
            modifier.mapFromForm?.(data, input);
        }

        runInAction(() => {
            this.loading = true;
        });

        try {
            return await this.createLayout.execute(input);
        } catch (error) {
            this.notifications.warning({
                title: "Could not create the layout",
                description: getLayoutErrorMessage(error)
            });
            return null;
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    /**
     * The slug follows the title, filled in each time the title is left, until the slug is edited. It isn't
     * derived reactively: an input commits its typed value after a delay, and a derived value arriving in
     * between would replace what's being typed.
     */
    private fillSlug(form: IFormModel, title: string) {
        const slug = form.field("slug");
        const current = String(slug.getValue() ?? "");
        if (current && current !== this.filledSlug) {
            return;
        }

        this.filledSlug = title.trim() ? LayoutSlug.fromTitle(title).toString() : "";
        slug.setValue(this.filledSlug);
    }

    private buildForm(): IFormModel {
        // Base form: always present.
        const form = this.factory.create({
            fields: fields => ({
                title: fields
                    .text()
                    .label("Title")
                    .placeholder("e.g. Main layout")
                    .required("Title is required")
                    .onBlur((value, { form }) => this.fillSlug(form, String(value ?? ""))),
                slug: fields
                    .text()
                    .label("Slug")
                    .description(
                        "Code uses it to render content in this layout. It must be unique."
                    )
                    .required("Slug is required")
                    .beforeChange(value => LayoutSlug.fromInput(value).toString())
            }),
            layout: layout => [layout.row("title"), layout.row("slug")]
        });

        // Cross-cutting modifiers (Language, etc.).
        for (const modifier of this.modifiers) {
            modifier.modifyForm(form);
        }

        return form;
    }
}

export const CreateLayoutPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: CreateLayoutPresenterImpl,
    dependencies: [
        FormModelFactory,
        [CreateLayoutFormModifier, { multiple: true }],
        CreateLayoutUseCase,
        Notifications
    ]
});
