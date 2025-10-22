import React from "react";
import {
    ContentEntryEditorConfig,
    ContentEntryListConfig
} from "~/admin/config/contentEntries/index.js";

import {
    ActionDelete,
    ActionMove,
    ActionPublish,
    ActionUnpublish
} from "~/admin/components/ContentEntries/BulkActions/index.js";
import { FilterByStatus } from "~/admin/components/ContentEntries/Filters/index.js";
import {
    DeleteEntry as DeleteEntryMenuItem,
    SaveAndPublishButton,
    SaveContentButton
} from "~/admin/components/ContentEntryForm/Header/index.js";
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
    CellModified,
    CellName,
    CellStatus
} from "~/admin/components/ContentEntries/Table/Cells/index.js";
import { Ref } from "~/admin/components/ContentEntries/Filters/RefFieldRenderer/index.js";
import { ShowConfirmationOnDelete } from "~/admin/components/Decorators/ShowConfirmationOnDelete.js";
import { ShowConfirmationOnPublish } from "~/admin/components/Decorators/ShowConfirmationOnPublish.js";
import { ShowConfirmationOnUnpublish } from "~/admin/components/Decorators/ShowConfirmationOnUnpublish.js";
import { ShowConfirmationOnDeleteRevision } from "~/admin/components/Decorators/ShowConfirmationOnDeleteRevision.js";
import { FullScreenContentEntry } from "~/admin/views/contentEntries/ContentEntry/FullScreenContentEntry/index.js";
import { ShowRevisionList } from "~/admin/components/ContentEntryForm/Header/ShowRevisionsList/index.js";
import { cmsLegacyEntryEditor } from "~/utils/cmsLegacyEntryEditor.js";
import { ScheduleEntryMenuItem } from "~/admin/components/ContentEntries/Scheduler/actions/ScheduleEntryAction.js";

import { CompareEntryRevisionList } from "~/admin/views/contentEntries/CompareEntryRevisions/CompareEntryRevisionList.js";

const { Browser } = ContentEntryListConfig;
const { Actions } = ContentEntryEditorConfig;

export const ContentEntriesModule = () => {
    return (
        <>
            <ContentEntryListConfig>
                <Browser.Filter name={"status"} element={<FilterByStatus />} />
                <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
                <Browser.BulkAction name={"unpublish"} element={<ActionUnpublish />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
                <Browser.FolderAction name={"edit"} element={<EditFolder />} />
                <Browser.FolderAction name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.FolderAction name={"delete"} element={<DeleteFolder />} />
                <Browser.EntryAction name={"edit"} element={<EditEntry />} />
                <Browser.EntryAction name={"status"} element={<ChangeEntryStatus />} />
                <Browser.EntryAction name={"move"} element={<MoveEntry />} />
                <Browser.EntryAction name={"delete"} element={<DeleteEntry />} />
                <Browser.Table.Column
                    name={"name"}
                    header={"Name"}
                    cell={<CellName />}
                    sortable={true}
                    hideable={false}
                    size={200}
                    className={"cms-aco-list-title"}
                />
                <Browser.Table.Column
                    name={"createdBy"}
                    header={"Author"}
                    cell={<CellAuthor />}
                    className={"cms-aco-list-createdBy"}
                />
                <Browser.Table.Column
                    name={"createdOn"}
                    header={"Created"}
                    cell={<CellCreated />}
                    sortable={true}
                    className={"cms-aco-list-createdOn"}
                />
                <Browser.Table.Column
                    name={"savedOn"}
                    header={"Modified"}
                    cell={<CellModified />}
                    sortable={true}
                    className={"cms-aco-list-savedOn"}
                />
                <Browser.Table.Column
                    name={"status"}
                    header={"Status"}
                    cell={<CellStatus />}
                    className={"cms-aco-list-status"}
                />
                <Browser.Table.Column
                    name={"actions"}
                    header={""}
                    cell={<CellActions />}
                    size={56}
                    resizable={false}
                    hideable={false}
                    className={"cms-aco-list-actions wby-text-right"}
                />
                <Browser.AdvancedSearch.FieldRenderer
                    name={"ref"}
                    element={<Ref />}
                    type={Browser.AdvancedSearch.FieldRenderer.FieldType.REF}
                />
            </ContentEntryListConfig>
            <ContentEntryEditorConfig>
                <ShowConfirmationOnPublish />
                <ShowConfirmationOnUnpublish />
                <ShowConfirmationOnDelete />
                <ShowConfirmationOnDeleteRevision />
                <Actions.ButtonAction name={"save"} element={<SaveContentButton />} />
                <Actions.ButtonAction name={"publish"} element={<SaveAndPublishButton />} />
                <Actions.MenuItemAction name={"delete"} element={<DeleteEntryMenuItem />} />
                <Actions.MenuItemAction name={"schedule"} element={<ScheduleEntryMenuItem />} />
                {/*
                    The following Menu Action registration is needed
                    only when the 'cmsLegacyEntryEditor' feature is NOT enabled.
                */}
                <Actions.MenuItemAction
                    name={"showRevisionsList"}
                    element={<ShowRevisionList />}
                    remove={cmsLegacyEntryEditor}
                />

                <Actions.MenuItemAction
                    name={"compareEntryRevisionList"}
                    element={<CompareEntryRevisionList />}
                    remove={cmsLegacyEntryEditor}
                />
            </ContentEntryEditorConfig>
            <FullScreenContentEntry />
        </>
    );
};

