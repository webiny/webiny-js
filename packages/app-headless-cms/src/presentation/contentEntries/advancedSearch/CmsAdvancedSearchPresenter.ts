import { makeAutoObservable } from "mobx";
import { runInAction } from "mobx";
import { GraphQLInputMapper } from "@webiny/app-aco/components/AdvancedSearch/GraphQLInputMapper.js";
import type { FieldRaw } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import type { FilterDTO } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import { ListUsersWhoCanReadEntriesUseCase } from "~/features/contentEntry/listUsersWhoCanReadEntries/abstractions.js";
import { ContentEntriesPresenter } from "~/presentation/contentEntries/list/abstractions.js";
import { FieldsMapper } from "./FieldsMapper.js";
import { CmsAdvancedSearchPresenter as Abstraction } from "./abstractions.js";
import type { EntryAuthor } from "./abstractions.js";
import { wrapUserFields } from "./wrapUserFields.js";

class CmsAdvancedSearchPresenterImpl implements Abstraction.Interface {
    /*
     * The authors loaded for each model, by model ID. One presenter serves every model the list
     * switches to, so a model's users are only ever offered on that model.
     */
    private authorsByModel = new Map<string, EntryAuthor[]>();
    /*
     * The keys of the list's where input this search set. The list's filters also hold keys set by
     * other controls, such as `folderId`, and those are never cleared from here.
     */
    private appliedKeys: string[] = [];

    constructor(
        private listReaders: ListUsersWhoCanReadEntriesUseCase.Interface,
        private contentEntries: ContentEntriesPresenter.Interface
    ) {
        makeAutoObservable<CmsAdvancedSearchPresenterImpl, "listReaders" | "contentEntries">(this, {
            listReaders: false,
            contentEntries: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return { authors: this.currentAuthors, fields: this.fields };
    }

    private get currentAuthors(): EntryAuthor[] {
        const modelId = this.contentEntries.vm.model.modelId;
        return this.authorsByModel.get(modelId) ?? [];
    }

    private get fields(): FieldRaw[] {
        return FieldsMapper.toRaw(this.contentEntries.vm.model, this.currentAuthors);
    }

    /*
     * Asked on every mount and for every model, so the list always belongs to the identity that is
     * signed in now and to the model on screen. The API only lists the users who can read the
     * model's entries, and an identity limited to its own entries gets only itself. A model seen
     * before keeps offering its last authors while they load again. A failed request changes
     * nothing, so the Author filter keeps its last authors, or stays out if it never had any.
     */
    async loadAuthors(): Promise<void> {
        const modelId = this.contentEntries.vm.model.modelId;
        let authors: EntryAuthor[];
        try {
            authors = await this.listReaders.execute(modelId);
        } catch {
            return;
        }

        runInAction(() => {
            this.authorsByModel.set(modelId, authors);
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
    dependencies: [ListUsersWhoCanReadEntriesUseCase, ContentEntriesPresenter]
});
