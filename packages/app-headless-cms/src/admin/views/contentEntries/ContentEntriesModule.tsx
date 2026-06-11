import React from "react";
import {
    ContentEntryEditorConfig,
    InternalContentEntryListConfig
} from "~/admin/config/contentEntries/index.js";

import {
    ActionDelete,
    ActionMove,
    ActionPublish,
    ActionUnpublish
} from "~/admin/components/ContentEntries/BulkActions/index.js";
import { FilterByStatus } from "~/admin/components/ContentEntries/Filters/index.js";
import { SaveContentButton } from "~/presentation/contentEntries/views/actions/SaveContentButton.js";
import { SaveAndPublishButton } from "~/presentation/contentEntries/views/actions/SaveAndPublishButton.js";
import { DeleteEntryMenuItem } from "~/presentation/contentEntries/views/actions/DeleteEntryMenuItem.js";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    ChangeEntryStatus,
    DeleteEntry,
    EditEntry,
    MoveEntry
} from "~/admin/components/ContentEntries/Table/Actions/index.js";
import {
    CellActions,
    CellAuthor,
    CellCreated,
    CellLive,
    CellModified,
    CellName,
    CellStatus
} from "~/admin/components/ContentEntries/Table/Cells/index.js";
import { Ref } from "~/admin/components/ContentEntries/Filters/RefFieldRenderer/index.js";
import { PublishEntryConfirmDialog } from "~/admin/components/Dialogs/PublishEntryConfirmDialog.js";
import { UnpublishEntryConfirmDialog } from "~/admin/components/Dialogs/UnpublishEntryConfirmDialog.js";
import { DeleteRevisionConfirmDialog } from "~/admin/components/Dialogs/DeleteRevisionConfirmDialog.js";
import { FullScreenContentEntry } from "~/admin/views/contentEntries/ContentEntry/FullScreenContentEntry/index.js";
import { ShowRevisionListMenuItem as ShowRevisionList } from "~/presentation/contentEntries/views/actions/ShowRevisionListMenuItem.js";
import { AdvancedSearchConfigs } from "@webiny/app-aco/components/AdvancedSearch/AdvancedSearchConfigs";
import { IsModelPublishable } from "~/admin/components/IsModelPublishable.js";
import { ContentFormOptionsMenu } from "~/presentation/contentEntries/views/actions/ContentFormOptionsMenu.js";
import { RevisionSelector } from "~/presentation/contentEntries/views/actions/RevisionSelector.js";
import { AdminConfig } from "@webiny/app-admin";
import { TrashEntryConfirmDialog } from "~/admin/components/Dialogs/TrashEntryConfirmDialog.js";
import { CmsTrashBin } from "~/presentation/contentEntries/trashBin/CmsTrashBin.js";
import {
    TRASH_ENTRY_DIALOG,
    PUBLISH_ENTRY_DIALOG,
    UNPUBLISH_ENTRY_DIALOG
} from "~/presentation/contentEntries/list/ContentEntriesPresenter.js";
import { DELETE_REVISION_DIALOG } from "~/presentation/contentEntries/revisionsList/RevisionsListPresenter.js";

const { Browser } = InternalContentEntryListConfig;
const { Actions } = ContentEntryEditorConfig;

export const ContentEntriesModule = () => {
    return (
        <>
            <AdminConfig>
                <AdminConfig.Dialog
                    name={TRASH_ENTRY_DIALOG}
                    element={<TrashEntryConfirmDialog />}
                />
                <AdminConfig.Dialog
                    name={PUBLISH_ENTRY_DIALOG}
                    element={<PublishEntryConfirmDialog />}
                />
                <AdminConfig.Dialog
                    name={UNPUBLISH_ENTRY_DIALOG}
                    element={<UnpublishEntryConfirmDialog />}
                />
                <AdminConfig.Dialog
                    name={DELETE_REVISION_DIALOG}
                    element={<DeleteRevisionConfirmDialog />}
                />
            </AdminConfig>
            <InternalContentEntryListConfig>
                <AdvancedSearchConfigs />
                <IsModelPublishable>
                    <Browser.Filter name={"status"} element={<FilterByStatus />} />
                    <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
                    <Browser.BulkAction name={"unpublish"} element={<ActionUnpublish />} />
                </IsModelPublishable>
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
                <Browser.Folder.Action name={"edit"} element={<EditFolder />} />
                <Browser.Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.Folder.Action name={"delete"} element={<DeleteFolder />} />
                <Browser.Entry.Action name={"edit"} element={<EditEntry />} />
                <IsModelPublishable>
                    <Browser.Entry.Action name={"status"} element={<ChangeEntryStatus />} />
                </IsModelPublishable>
                <Browser.Entry.Action name={"move"} element={<MoveEntry />} />
                <Browser.Entry.Action name={"delete"} element={<DeleteEntry />} after={"$last"} />
                <Browser.Table.Column
                    name={"name"}
                    header={"Name"}
                    cell={<CellName />}
                    sortable={true}
                    hideable={false}
                    size={200}
                />
                <Browser.Table.Column name={"createdBy"} header={"Author"} cell={<CellAuthor />} />
                <Browser.Table.Column
                    name={"createdOn"}
                    header={"Created"}
                    cell={<CellCreated />}
                    sortable={true}
                />
                <Browser.Table.Column
                    name={"savedOn"}
                    header={"Modified"}
                    cell={<CellModified />}
                    sortable={true}
                />
                <IsModelPublishable>
                    <Browser.Table.Column
                        name={"status"}
                        header={"Status"}
                        cell={<CellStatus />}
                        truncate={false}
                    />
                    <Browser.Table.Column
                        name={"live"}
                        header={"Live"}
                        truncate={false}
                        cell={<CellLive />}
                    />
                </IsModelPublishable>
                <Browser.Table.Column
                    name={"actions"}
                    header={""}
                    cell={<CellActions />}
                    size={56}
                    resizable={false}
                    hideable={false}
                    truncate={false}
                    className={"flex justify-center"}
                />
                <Browser.AdvancedSearch.FieldRenderer
                    name={"ref"}
                    element={<Ref />}
                    type={Browser.AdvancedSearch.FieldRenderer.FieldType.REF}
                />
                <Browser.Sidebar.Footer name={"trash"} element={<CmsTrashBin />} />
            </InternalContentEntryListConfig>
            <ContentEntryEditorConfig>
                <IsModelPublishable>
                    <Actions.ButtonAction
                        name={"revisionSelector"}
                        element={<RevisionSelector />}
                    />
                </IsModelPublishable>
                <Actions.ButtonAction name={"optionsMenu"} element={<ContentFormOptionsMenu />} />
                <Actions.ButtonAction name={"save"} element={<SaveContentButton />} />
                <IsModelPublishable>
                    <Actions.ButtonAction name={"publish"} element={<SaveAndPublishButton />} />
                </IsModelPublishable>
                <Actions.MenuItemAction
                    name={"delete"}
                    element={<DeleteEntryMenuItem />}
                    after={"$last"}
                />
                <IsModelPublishable>
                    <Actions.MenuItemAction
                        name={"showRevisionsList"}
                        element={<ShowRevisionList />}
                    />
                </IsModelPublishable>
            </ContentEntryEditorConfig>
            <FullScreenContentEntry />
        </>
    );
};
