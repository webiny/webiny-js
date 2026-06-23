import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { AdvancedSearchConfigs } from "@webiny/app-aco/components/AdvancedSearch/AdvancedSearchConfigs";
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
import {
    DeleteEntry as DeleteEntryMenuItem,
    SaveAndPublishButton,
    SaveContentButton
} from "~/admin/components/ContentEntryForm/Header/index.js";
import {
    TRASH_ENTRY_DIALOG,
    PUBLISH_ENTRY_DIALOG,
    UNPUBLISH_ENTRY_DIALOG
} from "~/presentation/contentEntries/list/ContentEntriesPresenter.js";
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
import { ShowRevisionList } from "~/admin/components/ContentEntryForm/Header/ShowRevisionsList/index.js";
import { IsModelPublishable } from "~/admin/components/IsModelPublishable.js";
import { ContentFormOptionsMenu } from "~/admin/components/ContentEntryForm/Header/ContentFormOptionsMenu/index.js";
import { RevisionSelector } from "~/admin/components/ContentEntryForm/Header/index.js";
import { FilterByStatus } from "~/admin/components/ContentEntries/FilterByStatus.js";
import { CmsTrashBin } from "~/presentation/contentEntries/trashBin/CmsTrashBin.js";
import { TrashEntryConfirmDialog } from "~/admin/components/Dialogs/TrashEntryConfirmDialog.js";
import { PublishEntryConfirmDialog } from "~/admin/components/Dialogs/PublishEntryConfirmDialog.js";
import { UnpublishEntryConfirmDialog } from "~/admin/components/Dialogs/UnpublishEntryConfirmDialog.js";
import { DeleteRevisionConfirmDialog } from "~/admin/components/Dialogs/DeleteRevisionConfirmDialog.js";
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
                <Browser.Sidebar.Footer name={"trashBin"} element={<CmsTrashBin />} />
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
                <Actions.MenuItemAction name={"delete"} element={<DeleteEntryMenuItem />} />
                <IsModelPublishable>
                    <Actions.MenuItemAction
                        name={"showRevisionsList"}
                        element={<ShowRevisionList />}
                    />
                </IsModelPublishable>
            </ContentEntryEditorConfig>
        </>
    );
};
