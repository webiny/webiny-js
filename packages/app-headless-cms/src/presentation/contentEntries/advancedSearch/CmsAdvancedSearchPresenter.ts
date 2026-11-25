import { makeAutoObservable } from "mobx";
import { runInAction } from "mobx";
import { GraphQLInputMapper } from "@webiny/app-aco/components/AdvancedSearch/GraphQLInputMapper.js";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";
import type { FieldRaw } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import type { FilterDTO } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import { ListFolderPermissionsTargetsUseCase } from "~/features/listFolderPermissionsTargets/abstractions.js";
import { ContentEntriesPresenter } from "~/presentation/contentEntries/list/abstractions.js";
import { FieldsMapper } from "./FieldsMapper.js";
import { CmsAdvancedSearchPresenter as Abstraction } from "./abstractions.js";
import type { EntryAuthor } from "./abstractions.js";
import { wrapUserFields } from "./wrapUserFields.js";

const toAuthor = (target: FolderLevelPermissionsTarget): EntryAuthor => {
    return { id: target.id, displayName: target.name || target.meta?.email || target.id };
};

class CmsAdvancedSearchPresenterImpl implements Abstraction.Interface {
    private authors: EntryAuthor[] = [];
    /*
     * The keys of the list's where input this search set. The list's filters also hold keys set by
     * other controls, such as `folderId`, and those are never cleared from here.
     */
    private appliedKeys: string[] = [];
    // Counts the author loads, so a load that finishes after a newer one leaves its result unused.
    private authorsLoad = 0;

    constructor(
        private listTargets: ListFolderPermissionsTargetsUseCase.Interface,
        private contentEntries: ContentEntriesPresenter.Interface
    ) {
        makeAutoObservable<
            CmsAdvancedSearchPresenterImpl,
            "listTargets" | "contentEntries" | "authorsLoad"
        >(this, {
            listTargets: false,
            contentEntries: false,
            authorsLoad: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return { authors: this.authors, fields: this.fields };
    }

    private get fields(): FieldRaw[] {
        return FieldsMapper.toRaw(this.contentEntries.vm.model, this.authors);
    }

    /*
     * Asked on every mount, so the list always belongs to the identity that is signed in now. The
     * API returns no users to an identity that cannot read them, and that identity gets no Author
     * filter. A failed request leaves the filter out until the next mount.
     */
    async loadAuthors(): Promise<void> {
        const load = ++this.authorsLoad;
        let targets: FolderLevelPermissionsTarget[] = [];
        try {
            targets = await this.listTargets.execute();
        } catch {
            targets = [];
        }

        if (load !== this.authorsLoad) {
            return;
        }

        const authors = targets.filter(target => target.type === "admin").map(toAuthor);
        runInAction(() => {
            this.authors = authors;
        });
    }

    applyFilter(data: FilterDTO | null): void {
        let where: Record<string, unknown> = {};
        if (data && Object.keys(data).length) {
            const graphQLWhere = GraphQLInputMapper.toGraphQL(data);
            where = wrapUserFields(graphQLWhere);
        }

        const filter = this.contentEntries.list.actions.filter;
        for (const key of this.appliedKeys) {
            if (!(key in where)) {
                filter.clear(key);
            }
        }
        for (const [key, value] of Object.entries(where)) {
            filter.set(key, value);
        }
        this.appliedKeys = Object.keys(where);
    }

    /*
     * Called when the search unmounts. The search forgets its applied filter when it is hidden, so
     * the list drops it too, rather than staying narrowed by a filter nothing on screen shows.
     */
    clearFilter(): void {
        this.applyFilter(null);
    }
}

export const CmsAdvancedSearchPresenter = Abstraction.createImplementation({
    implementation: CmsAdvancedSearchPresenterImpl,
    dependencies: [ListFolderPermissionsTargetsUseCase, ContentEntriesPresenter]
});
