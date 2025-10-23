import React from "react";

import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as File } from "@webiny/icons/description.svg";

import type { RedirectTableRow } from "~/modules/redirects/RedirectsList/presenters/index.js";
import { RedirectListConfig } from "~/modules/redirects/configs/index.js";
import { FolderCellName } from "~/modules/shared/FolderCellName.js";
import { useEditRedirectDialog } from "~/modules/redirects/RedirectsList/index.js";

interface DocumentCellRowTitleProps {
    document: RedirectTableRow["data"];
}

const DocumentCellRowTitle = ({ document }: DocumentCellRowTitleProps) => {
    const { showEditRedirectDialog } = useEditRedirectDialog();

    return (
        <div className={"flex flex-col gap-y-[3px]"}>
            <div
                className={"flex w-full items-center cursor-pointer"}
                onClick={() => showEditRedirectDialog(document.id)}
            >
                <Icon
                    size={"sm"}
                    color={"neutral-strong"}
                    className={"mr-xs"}
                    icon={<File />}
                    label={`Redirect - ${document.title}`}
                />
                <Text as={"div"} className={"truncate min-w-0 flex-shrink"}>
                    {document.title}
                </Text>
            </div>
        </div>
    );
};

interface EntryCellNameProps {
    document: RedirectTableRow["data"];
}

export const DocumentCellName = ({ document }: EntryCellNameProps) => {
    return <DocumentCellRowTitle document={document} />;
};

export const CellName = () => {
    const { useTableRow, isFolderRow } = RedirectListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <FolderCellName folder={row.data} />;
    }

    return <DocumentCellName document={row.data} />;
};
