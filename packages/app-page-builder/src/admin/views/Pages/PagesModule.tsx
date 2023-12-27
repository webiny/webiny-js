import React from "react";
import { PageListConfig } from "~/admin/config/pages";

import {
    ActionDelete,
    ActionExport,
    ActionMove,
    ActionPublish,
    ActionUnpublish
} from "~/admin/components/BulkActions";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";

const { Browser } = PageListConfig;

export const PagesModule = () => {
    return (
        <>
            <PageListConfig>
                <Browser.BulkAction name={"export"} element={<ActionExport />} />
                <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
                <Browser.BulkAction name={"unpublish"} element={<ActionUnpublish />} />
                <Browser.BulkAction name={"move"} element={<ActionMove />} />
                <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
                <Browser.FolderAction name={"edit"} element={<EditFolder />} />
                <Browser.FolderAction name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.FolderAction name={"delete"} element={<DeleteFolder />} />
            </PageListConfig>
        </>
    );
};
