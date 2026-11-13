import { observer } from "mobx-react-lite";
import { useAssistantPageContext } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";

/** Enough to resolve a folder named in a question; a folder with more children is rarely on screen whole. */
const MAX_VISIBLE_FOLDERS = 30;

/**
 * Tells the assistant which model's entries are on screen, which folder is open, the folders shown
 * in it and the entry being edited, so "list the entries" or "the Archive folder" need no lookup.
 * The keys are named after the tool arguments they feed: `modelId`, and `folderType` for
 * `listFolders`' `type`. Ids and titles only; entry contents never leave the view this way.
 */
export const AssistantPageContextSync = observer(() => {
    const presenter = useContentEntriesPresenter();
    const { model, childFolders, selectedEntryId } = presenter.vm;
    const { currentFolderId, currentFolderTitle } = presenter.folders.vm;

    const visibleFolders = childFolders.slice(0, MAX_VISIBLE_FOLDERS).map(folder => ({
        id: folder.id,
        title: folder.title
    }));

    const details: Record<string, unknown> = {
        modelId: model.modelId,
        modelName: model.name,
        folderType: `cms:${model.modelId}`,
        currentFolder: currentFolderId ? { id: currentFolderId, title: currentFolderTitle } : null,
        visibleFolders
    };

    if (selectedEntryId === "new") {
        details["editing"] = "a new entry, not saved yet";
    } else if (selectedEntryId) {
        // The list opens a revision ("abc#0002"); the entry tools take the entry's own id.
        const { id: entryId } = parseIdentifier(selectedEntryId);
        details["openEntryId"] = entryId;
    }

    useAssistantPageContext({
        view: `Entries of the "${model.name}" content model in Headless CMS`,
        details
    });

    return null;
});
