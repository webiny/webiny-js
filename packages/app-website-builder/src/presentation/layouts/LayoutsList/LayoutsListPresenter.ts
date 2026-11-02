import { computed, makeAutoObservable } from "mobx";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import {
    ListLanguagesRepository,
    ListLanguagesUseCase
} from "@webiny/languages/admin/features/listLanguages/abstractions.js";
import {
    DeleteLayoutUseCase,
    DuplicateLayoutUseCase,
    getLayoutErrorMessage,
    GetLayoutSettingsUseCase,
    type Layout,
    LayoutsRepository,
    ListLayoutsUseCase,
    SetDefaultLayoutUseCase,
    TranslateLayoutUseCase
} from "~/features/layouts/index.js";
import { LayoutIdentity } from "~/domain/Layout/index.js";
import { LayoutsListPresenter as PresenterAbstraction } from "./abstractions.js";

const listLabel = (items: string[]) => items.join(", ");

class LayoutsListPresenterImpl implements PresenterAbstraction.Interface {
    constructor(
        private repository: LayoutsRepository.Interface,
        private listLayouts: ListLayoutsUseCase.Interface,
        private getLayoutSettings: GetLayoutSettingsUseCase.Interface,
        private deleteLayout: DeleteLayoutUseCase.Interface,
        private duplicateLayout: DuplicateLayoutUseCase.Interface,
        private translateLayout: TranslateLayoutUseCase.Interface,
        private setDefaultLayout: SetDefaultLayoutUseCase.Interface,
        private listLanguages: ListLanguagesUseCase.Interface,
        private languages: ListLanguagesRepository.Interface,
        private notifications: Notifications.Interface
    ) {
        makeAutoObservable<
            LayoutsListPresenterImpl,
            | "repository"
            | "listLayouts"
            | "getLayoutSettings"
            | "deleteLayout"
            | "duplicateLayout"
            | "translateLayout"
            | "setDefaultLayout"
            | "listLanguages"
            | "languages"
            | "notifications"
        >(
            this,
            {
                vm: computed,
                repository: false,
                listLayouts: false,
                getLayoutSettings: false,
                deleteLayout: false,
                duplicateLayout: false,
                translateLayout: false,
                setDefaultLayout: false,
                listLanguages: false,
                languages: false,
                notifications: false
            },
            { autoBind: true }
        );
    }

    get vm(): PresenterAbstraction.ViewModel {
        const layouts = this.repository.layouts;
        const languages = this.languages.getLanguages();
        const defaultLayout = this.repository.settings?.defaultLayout ?? null;
        const sourceIds = new Set(
            layouts
                .filter(layout => LayoutIdentity.from(layout).isSource())
                .map(item => item.entryId)
        );

        // A language version is listed under its source; one without a listed source gets its own row.
        const rows = layouts
            .filter(layout => {
                const identity = LayoutIdentity.from(layout);
                return identity.isSource() || !sourceIds.has(identity.sourceId()!);
            })
            .map(layout => {
                const identity = LayoutIdentity.from(layout);
                const isSource = identity.isSource();
                const versions = isSource
                    ? layouts
                          .filter(item => LayoutIdentity.from(item).isVersionOf(layout.entryId))
                          .map(version => ({
                              layout: version,
                              title: LayoutIdentity.from(version).title(),
                              language: version.properties.language ?? "",
                              languageLabel: this.getLanguageLabel(version.properties.language),
                              status: version.status,
                              version: version.version,
                              liveVersion: version.live?.version ?? null,
                              author: version.createdBy?.displayName ?? null,
                              savedOn: version.savedOn
                          }))
                          .sort((a, b) => a.language.localeCompare(b.language))
                    : [];

                const takenLanguages = new Set<string>([
                    ...(layout.properties.language ? [layout.properties.language] : []),
                    ...versions.map(version => version.language)
                ]);

                const isDefault = isSource && defaultLayout === layout.entryId;

                return {
                    layout,
                    title: identity.title(),
                    slug: layout.properties.slug || null,
                    language: layout.properties.language ?? null,
                    languageLabel: layout.properties.language
                        ? this.getLanguageLabel(layout.properties.language)
                        : null,
                    status: layout.status,
                    version: layout.version,
                    liveVersion: layout.live?.version ?? null,
                    author: layout.createdBy?.displayName ?? null,
                    savedOn: layout.savedOn,
                    isDefault,
                    canSetDefault: identity.canBePicked() && !isDefault,
                    versions,
                    translatableLanguages: isSource
                        ? languages
                              .filter(language => !takenLanguages.has(language.code))
                              .map(language => ({
                                  code: language.code,
                                  label: `${language.name} (${language.code})`
                              }))
                        : []
                };
            });

        return {
            rows,
            loading: this.repository.loading,
            hasLanguages: languages.length > 0
        };
    }

    async init() {
        const [layouts, settings, languages] = await Promise.allSettled([
            this.listLayouts.execute(),
            this.getLayoutSettings.execute(),
            this.listLanguages.execute()
        ]);

        if (layouts.status === "rejected") {
            this.notifications.warning({
                title: "Could not list layouts",
                description: getLayoutErrorMessage(layouts.reason)
            });
        }

        if (settings.status === "rejected") {
            this.notifications.warning({
                title: "Could not load the default layout",
                description: getLayoutErrorMessage(settings.reason)
            });
        }

        if (languages.status === "rejected") {
            this.notifications.warning({
                title: "Could not list languages",
                description: getLayoutErrorMessage(languages.reason)
            });
        }
    }

    getDeleteConfirmation(layout: Layout) {
        const identity = LayoutIdentity.from(layout);
        const title = identity.title();

        if (!identity.isSource()) {
            const sourceId = identity.sourceId();
            const source = this.repository.layouts.find(item => item.entryId === sourceId);
            const language = layout.properties.language ?? "";
            const of = source ? ` of "${LayoutIdentity.from(source).title()}"` : "";
            return `Delete the "${language}" language version${of}? This can't be undone.`;
        }

        const versions = this.repository.layouts
            .filter(item => LayoutIdentity.from(item).isVersionOf(layout.entryId))
            .map(item => item.properties.language ?? "")
            .sort();

        if (versions.length === 0) {
            return `Delete "${title}"? Pages can't use it afterwards. This can't be undone.`;
        }

        const versionsLabel =
            versions.length === 1
                ? `its language version (${listLabel(versions)})`
                : `its ${versions.length} language versions (${listLabel(versions)})`;

        return `Delete "${title}" and ${versionsLabel}? Pages can't use them afterwards. This can't be undone.`;
    }

    async delete(layout: Layout) {
        try {
            await this.deleteLayout.execute(layout.entryId);
            this.notifications.success({
                title: `Layout "${LayoutIdentity.from(layout).title()}" was deleted.`
            });
            return true;
        } catch (error) {
            this.notifications.warning({
                title: "Could not delete the layout",
                description: getLayoutErrorMessage(error)
            });
            return false;
        }
    }

    async duplicate(layout: Layout) {
        try {
            const copy = await this.duplicateLayout.execute(layout.id);
            this.notifications.success({
                title: `Layout "${LayoutIdentity.from(layout).title()}" was duplicated.`
            });
            return copy;
        } catch (error) {
            this.notifications.warning({
                title: "Could not duplicate the layout",
                description: getLayoutErrorMessage(error)
            });
            return null;
        }
    }

    async translate(layout: Layout, language: string) {
        try {
            return await this.translateLayout.execute(layout.id, language);
        } catch (error) {
            this.notifications.warning({
                title: "Could not translate the layout",
                description: getLayoutErrorMessage(error)
            });
            return null;
        }
    }

    async setDefault(layout: Layout | null) {
        try {
            await this.setDefaultLayout.execute(layout ? layout.entryId : null);
            this.notifications.success({
                title: layout
                    ? `"${LayoutIdentity.from(layout).title()}" is now the default layout.`
                    : "New pages get no layout by default."
            });
        } catch (error) {
            this.notifications.warning({
                title: "Could not set the default layout",
                description: getLayoutErrorMessage(error)
            });
        }
    }

    private getLanguageLabel(code: string | null | undefined) {
        if (!code) {
            return "";
        }
        const language = this.languages.getLanguages().find(item => item.code === code);
        return language ? `${language.name} (${code})` : code;
    }
}

export const LayoutsListPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: LayoutsListPresenterImpl,
    dependencies: [
        LayoutsRepository,
        ListLayoutsUseCase,
        GetLayoutSettingsUseCase,
        DeleteLayoutUseCase,
        DuplicateLayoutUseCase,
        TranslateLayoutUseCase,
        SetDefaultLayoutUseCase,
        ListLanguagesUseCase,
        ListLanguagesRepository,
        Notifications
    ]
});
