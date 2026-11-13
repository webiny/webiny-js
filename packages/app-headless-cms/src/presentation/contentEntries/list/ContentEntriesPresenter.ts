import { compareStructural, computed, makeAutoObservable, reaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import { sortFolders } from "@webiny/app-aco";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { AssistantPageContext } from "@webiny/app-admin/features/assistantPageContext/abstractions.js";
import { FoldersContext } from "@webiny/app-aco/features/folders/abstractions.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import type { CmsContentEntry } from "~/types.js";
import { ListEntriesUseCase } from "~/features/contentEntry/listEntries/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { MoveEntryUseCase } from "~/features/contentEntry/moveEntry/abstractions.js";
import { DuplicateEntryUseCase } from "~/features/contentEntry/duplicateEntry/abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import {
    ContentEntriesCacheProvider,
    CmsModelContext
} from "~/features/contentEntry/abstractions.js";
import {
    ContentEntriesPresenter as Abstraction,
    type IContentEntriesViewModel,
    type IDuplicateEntryResult
} from "./abstractions.js";
import { ContentEntriesDataSource } from "./ContentEntriesDataSource.js";

export const TRASH_ENTRY_DIALOG = "trash-entry";
export const PUBLISH_ENTRY_DIALOG = "publish-entry";
export const UNPUBLISH_ENTRY_DIALOG = "unpublish-entry";
export const DUPLICATE_ENTRY_DIALOG = "duplicate-entry";

/** Enough to resolve a folder named in a question; a folder with more children is rarely on screen whole. */
const MAX_ASSISTANT_FOLDERS = 30;

/** Keeps 30 folders well under the server's 4000-character limit, which drops all the details when hit. */
const MAX_ASSISTANT_FOLDER_TITLE = 60;

class ContentEntriesPresenterImpl implements Abstraction.Interface {
    private selectedEntryId: string | null = null;
    private disposeReaction: IReactionDisposer | null = null;
    private disposeAssistantReaction: IReactionDisposer | null = null;
    private assistantContextOwner: AssistantPageContext.Owner | null = null;

    constructor(
        private listPresenter: ListPresenter.Interface<CmsContentEntry>,
        private foldersPresenter: FolderTreePresenter.Interface,
        private confirmation: Confirmation.Interface,
        private modelAccessor: CmsModelContext.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private publishEntryUseCase: PublishEntryUseCase.Interface,
        private unpublishEntryUseCase: UnpublishEntryUseCase.Interface,
        private moveEntryUseCase: MoveEntryUseCase.Interface,
        private duplicateEntryUseCase: DuplicateEntryUseCase.Interface,
        private updateRevisionDescriptionUseCase: UpdateRevisionDescriptionUseCase.Interface,
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private getDescendantFoldersUseCase: GetDescendantFoldersUseCase.Interface,
        private foldersContext: FoldersContext.Interface,
        private assistantPageContext: AssistantPageContext.Interface
    ) {
        makeAutoObservable<
            ContentEntriesPresenterImpl,
            | "disposeReaction"
            | "confirmation"
            | "modelAccessor"
            | "listEntriesUseCase"
            | "deleteEntryUseCase"
            | "publishEntryUseCase"
            | "unpublishEntryUseCase"
            | "moveEntryUseCase"
            | "duplicateEntryUseCase"
            | "updateRevisionDescriptionUseCase"
            | "cacheProvider"
            | "getDescendantFoldersUseCase"
            | "foldersContext"
            | "assistantPageContext"
            | "disposeAssistantReaction"
            | "assistantContextOwner"
        >(this, {
            disposeReaction: false,
            confirmation: false,
            modelAccessor: false,
            listEntriesUseCase: false,
            deleteEntryUseCase: false,
            publishEntryUseCase: false,
            unpublishEntryUseCase: false,
            moveEntryUseCase: false,
            duplicateEntryUseCase: false,
            updateRevisionDescriptionUseCase: false,
            cacheProvider: false,
            getDescendantFoldersUseCase: false,
            foldersContext: false,
            assistantPageContext: false,
            disposeAssistantReaction: false,
            assistantContextOwner: false,
            vm: computed
        });
    }

    private get model() {
        return this.modelAccessor.getModel();
    }

    get vm(): IContentEntriesViewModel {
        const appliedQuery = this.listPresenter.vm.appliedQuery;
        const hasSearch = !!appliedQuery?.search;
        const hasFilters = Object.keys(this.listPresenter.vm.filters).some(k => k !== "folderId");
        const showFolders = !hasSearch && !hasFilters;

        const childFolders = showFolders
            ? sortFolders(this.foldersPresenter.vm.childFolders ?? [], appliedQuery?.sort)
            : [];

        return {
            model: this.model,
            selectedEntryId: this.selectedEntryId,
            showingEntry: this.selectedEntryId !== null,
            showFolders,
            childFolders
        };
    }

    init(config: Abstraction.InitConfig = {}): void {
        const initialFolderId = config.initialFolderId ?? "root";

        const cache = this.cacheProvider.get(this.model.modelId);
        const dataSource = new ContentEntriesDataSource(
            this.model,
            this.listEntriesUseCase,
            cache,
            this.getDescendantFoldersUseCase,
            config.filterNames
        );

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "savedOn", direction: "DESC" },
            initialFilters: { folderId: initialFolderId },
            initialSearch: config.initialSearch,
            limit: 50,
            itemLabel: { singular: "entry", plural: "entries" }
        });

        if (initialFolderId !== "root") {
            this.foldersPresenter.selectFolder(initialFolderId);
        }

        this.disposeReaction = reaction(
            () => this.foldersPresenter.vm.currentFolderId,
            folderId => {
                const effectiveFolderId = folderId ?? "root";
                this.listPresenter.actions.filter.set("folderId", effectiveFolderId);
            }
        );

        this.disposeAssistantReaction = reaction(
            () => this.describeForAssistant(),
            context => this.setAssistantContext(context),
            { fireImmediately: true, equals: compareStructural }
        );
    }

    /**
     * What the assistant gets told about this view: the model, the open folder, the folders shown
     * and the open entry, so "list the entries" or "the Archive folder" need no lookup. Keys are
     * named after the tool arguments they feed: `modelId`, and `folderType` for `listFolders`'
     * `type`. Ids and titles only; entry contents never leave the view this way.
     */
    private describeForAssistant(): AssistantPageContext.Data {
        const { model, childFolders, selectedEntryId } = this.vm;
        const { currentFolderId, currentFolderTitle } = this.foldersPresenter.vm;

        const visibleFolders = childFolders.slice(0, MAX_ASSISTANT_FOLDERS).map(folder => ({
            id: folder.id,
            title: folder.title.slice(0, MAX_ASSISTANT_FOLDER_TITLE)
        }));

        const currentFolder = currentFolderId
            ? { id: currentFolderId, title: currentFolderTitle }
            : null;

        const details: Record<string, unknown> = {
            modelId: model.modelId,
            modelName: model.name,
            folderType: this.foldersContext.type,
            currentFolder,
            visibleFolders
        };

        if (selectedEntryId === "new") {
            details["editing"] = "a new entry, not saved yet";
        } else if (selectedEntryId) {
            // The list opens a revision ("abc#0002"); the entry tools take the entry's own id.
            const { id: entryId } = parseIdentifier(selectedEntryId);
            details["openEntryId"] = entryId;
        }

        return {
            view: `Entries of the "${model.name}" content model in Headless CMS`,
            details
        };
    }

    private setAssistantContext(context: AssistantPageContext.Data): void {
        this.clearAssistantContext();
        this.assistantContextOwner = this.assistantPageContext.set(context);
    }

    private clearAssistantContext(): void {
        if (this.assistantContextOwner) {
            this.assistantPageContext.clear(this.assistantContextOwner);
            this.assistantContextOwner = null;
        }
    }

    get list(): ListPresenter.Interface<CmsContentEntry> {
        return this.listPresenter;
    }

    get folders(): FolderTreePresenter.Interface {
        return this.foldersPresenter;
    }

    selectEntry(id: string): void {
        this.selectedEntryId = id;
    }

    deselectEntry(): void {
        this.selectedEntryId = null;
    }

    createEntry(): void {
        this.selectedEntryId = "new";
    }

    async deleteEntry(id: string): Promise<boolean> {
        const model = this.model;
        const result = await this.confirmation.confirm(TRASH_ENTRY_DIALOG, { entryId: id }, () =>
            this.deleteEntryUseCase.execute({ model, id })
        );
        return result !== false;
    }

    async publishEntry(id: string): Promise<boolean> {
        const model = this.model;
        const cache = this.cacheProvider.get(model.modelId);
        const entry = cache.getItem(item => item.id === id);
        if (!entry) {
            return false;
        }

        const result = await this.confirmation.confirm<{ revisionDescription: string }>(
            PUBLISH_ENTRY_DIALOG,
            { entry },
            async data => {
                if (data.revisionDescription) {
                    await this.updateRevisionDescriptionUseCase.execute({
                        model,
                        id,
                        revisionDescription: data.revisionDescription
                    });
                }
                await this.publishEntryUseCase.execute({ model, revisionId: id });
            }
        );
        return result !== false;
    }

    async unpublishEntry(id: string): Promise<boolean> {
        const model = this.model;
        const result = await this.confirmation.confirm(
            UNPUBLISH_ENTRY_DIALOG,
            { entryId: id },
            () => this.unpublishEntryUseCase.execute({ model, revisionId: id })
        );
        return result !== false;
    }

    async moveEntry(id: string, folderId: string): Promise<boolean> {
        await this.moveEntryUseCase.execute({ model: this.model, id, folderId });
        return true;
    }

    async duplicateEntry(entry: CmsContentEntry): Promise<IDuplicateEntryResult | false> {
        const model = this.model;
        return this.confirmation.confirm(
            DUPLICATE_ENTRY_DIALOG,
            { entry },
            async (): Promise<IDuplicateEntryResult> => {
                try {
                    const duplicate = await this.duplicateEntryUseCase.execute({
                        model,
                        revisionId: entry.id
                    });
                    return { entry: duplicate };
                } catch (error) {
                    return { error: error as Error };
                }
            }
        );
    }

    dispose(): void {
        if (this.disposeReaction) {
            this.disposeReaction();
            this.disposeReaction = null;
        }
        if (this.disposeAssistantReaction) {
            this.disposeAssistantReaction();
            this.disposeAssistantReaction = null;
        }
        this.clearAssistantContext();
    }
}

export const ContentEntriesPresenter = Abstraction.createImplementation({
    implementation: ContentEntriesPresenterImpl,
    dependencies: [
        ListPresenter,
        FolderTreePresenter,
        Confirmation,
        CmsModelContext,
        ListEntriesUseCase,
        DeleteEntryUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        MoveEntryUseCase,
        DuplicateEntryUseCase,
        UpdateRevisionDescriptionUseCase,
        ContentEntriesCacheProvider,
        GetDescendantFoldersUseCase,
        FoldersContext,
        AssistantPageContext
    ]
});
