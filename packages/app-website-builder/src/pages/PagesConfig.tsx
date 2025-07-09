import React from "react";
import { PageListConfig } from "../configs";
import { DeleteFolder, EditFolder, SetFolderPermissions } from "@webiny/app-aco";
import {
    CellActions,
    CellAuthor,
    CellCreated,
    CellModified,
    CellName,
    CellStatus,
    ChangeStatus,
    Delete,
    Duplicate,
    Edit,
    Move
} from "~/DocumentList/components/Table/index.js";

const { Browser } = PageListConfig;

export const PagesConfig = () => {
    return (
        <>
            <PageListConfig>
                <Browser.Folder.Action name={"edit"} element={<EditFolder />} />
                <Browser.Folder.Action name={"permissions"} element={<SetFolderPermissions />} />
                <Browser.Folder.Action name={"delete"} element={<DeleteFolder />} />
                <Browser.PageAction name={"edit"} element={<Edit />} />
                <Browser.PageAction name={"changeStatus"} element={<ChangeStatus />} />
                <Browser.PageAction name={"duplicate"} element={<Duplicate />} />
                <Browser.PageAction name={"moveToFolder"} element={<Move />} />
                <Browser.PageAction name={"delete"} element={<Delete />} />
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
                <Browser.Table.Column name={"status"} header={"Status"} cell={<CellStatus />} />
                <Browser.Table.Column
                    name={"actions"}
                    header={""}
                    cell={<CellActions />}
                    size={56}
                    resizable={false}
                    hideable={false}
                    className={"wby-text-right"}
                />
            </PageListConfig>
        </>
    );
};
