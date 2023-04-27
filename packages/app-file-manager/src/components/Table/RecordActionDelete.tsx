import React from "react";

import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";

import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { useDeleteFile } from "~/hooks/useDeleteFile";

import { FileItem } from "@webiny/app/types";
import { SearchRecordItem } from "@webiny/app-aco/types";

import { ListItemGraphic } from "./styled";

const t = i18n.ns("app-admin/file-manager/components/table/record-action-delete");

interface RecordActionDeleteProps {
    record: SearchRecordItem<FileItem>["data"];
}

export const RecordActionDelete: React.VFC<RecordActionDeleteProps> = ({ record }) => {
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
