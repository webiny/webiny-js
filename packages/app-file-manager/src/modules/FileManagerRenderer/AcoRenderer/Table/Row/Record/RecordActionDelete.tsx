import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";

import React, { ReactElement } from "react";

import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { useDeleteFile } from "~/modules/Hooks/useDeleteFile";

import { ListItemGraphic } from "~/modules/FileManagerRenderer/DefaultRenderer/Table/styled";

import { FileItem } from "@webiny/app/types";
import { SearchRecordItem } from "@webiny/app-aco/types";

const t = i18n.ns("app-admin/file-manager/file-manager-view/actions/file/delete");

interface RecordActionDeleteProps {
    record: SearchRecordItem<FileItem>["data"];
}

export const RecordActionDelete = ({ record }: RecordActionDeleteProps): ReactElement | null => {
    const { canEdit } = useFileManagerApi();
    const { openDialogDeleteFile } = useDeleteFile({
        file: record
    });

    if (!canEdit(record)) {
        return null;
    }

    return (
        <MenuItem onClick={openDialogDeleteFile}>
            <ListItemGraphic>
                <Icon icon={<Delete />} />
            </ListItemGraphic>
            {t`Delete`}
        </MenuItem>
    );
};
