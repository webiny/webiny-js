import { computed, makeAutoObservable, runInAction } from "mobx";
import type { IFieldBuilderRegistry, IFormModel, IFormModelFactory } from "@webiny/app-admin";
import { FormModelFactory } from "@webiny/app-admin";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import {
    GetLayoutUsageUseCase,
    UpdateLayoutUseCase,
    getLayoutErrorMessage,
    getLayoutModelsLabel
} from "~/features/layouts/index.js";
import { LayoutSlug } from "~/shared/LayoutSlug.js";
import { LayoutPropertiesPresenter as PresenterAbstraction } from "./abstractions.js";

class LayoutPropertiesPresenterImpl implements PresenterAbstraction.Interface {
    private form: IFormModel | null = null;
    private params: PresenterAbstraction.Init | null = null;
    private saving = false;
    private renameWarning: string | null = null;
    // The slug the rename warning was shown for: saving it again confirms the rename.
    private warnedSlug: string | null = null;

    constructor(
        private factory: IFormModelFactory,
        private updateLayout: UpdateLayoutUseCase.Interface,
        private getLayoutUsage: GetLayoutUsageUseCase.Interface,
        private notifications: Notifications.Interface
    ) {
        makeAutoObservable<
            LayoutPropertiesPresenterImpl,
            "factory" | "updateLayout" | "getLayoutUsage" | "notifications" | "params"
        >(
            this,
            {
                vm: computed,
                factory: false,
                updateLayout: false,
                getLayoutUsage: false,
                notifications: false,
                params: false
            },
            { autoBind: true }
        );
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            form: this.form ? this.form.vm : null,
            saving: this.saving,
            renameWarning: this.renameWarning
        };
    }

    init(params: PresenterAbstraction.Init) {
        this.params = params;
        this.saving = false;
        this.renameWarning = null;
        this.warnedSlug = null;
        this.form = this.buildForm(params);
    }

    async submit() {
        const params = this.params;
        if (!this.form || !params) {
            return null;
        }
        const data = await this.form.submit();
        if (!data) {
            return null;
        }

        const properties: Record<string, string> = { title: String(data.title ?? "").trim() };
        if (!params.isLanguageVersion) {
            properties.slug = LayoutSlug.fromInput(data.slug).complete().toString();
        }

        runInAction(() => {
            this.saving = true;
        });

        try {
            if (await this.warnBeforeRename(params, properties.slug)) {
                return null;
            }
            return await this.updateLayout.execute(params.id, { properties });
        } catch (error) {
            this.notifications.warning({
                title: "Could not save the layout settings",
                description: getLayoutErrorMessage(error)
            });
            return null;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    /**
     * A CMS model names a layout by its slug in code, so renaming it leaves the model's entries without the
     * layout until that code changes. The first save of a new slug names those models instead of saving.
     */
    private async warnBeforeRename(params: PresenterAbstraction.Init, slug: string | undefined) {
        if (!params.slug || !slug || slug === params.slug || slug === this.warnedSlug) {
            return false;
        }

        const usage = await this.getLayoutUsage.execute(params.id).catch(() => null);
        if (!usage || usage.models.length === 0) {
            return false;
        }

        const label = getLayoutModelsLabel(usage.models);
        const its = usage.models.length === 1 ? "its" : "their";
        runInAction(() => {
            this.warnedSlug = slug;
            this.renameWarning = `This layout is used by ${label}, whose "layout" setting in code names the slug "${params.slug}". Until it names "${slug}", ${its} entries render without this layout. Click Save again to rename it.`;
        });
        return true;
    }

    private buildForm(params: PresenterAbstraction.Init): IFormModel {
        const title = (fields: IFieldBuilderRegistry) =>
            fields.text().label("Title").required("Title is required").defaultValue(params.title);

        // A language version is named by its source's slug: it has none to edit.
        if (params.isLanguageVersion) {
            return this.factory.create({
                fields: fields => ({ title: title(fields) }),
                layout: layout => [layout.row("title")]
            });
        }

        return this.factory.create({
            fields: fields => ({
                title: title(fields),
                // An older layout without a slug is offered one made from its title.
                slug: fields
                    .text()
                    .label("Slug")
                    .description(
                        "Code uses it to render content in this layout. It must be unique."
                    )
                    .required("Slug is required")
                    .defaultValue(params.slug || LayoutSlug.fromTitle(params.title).toString())
                    .beforeChange(value => LayoutSlug.fromInput(value).toString())
            }),
            layout: layout => [layout.row("title"), layout.row("slug")]
        });
    }
}

export const LayoutPropertiesPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: LayoutPropertiesPresenterImpl,
    dependencies: [FormModelFactory, UpdateLayoutUseCase, GetLayoutUsageUseCase, Notifications]
});
