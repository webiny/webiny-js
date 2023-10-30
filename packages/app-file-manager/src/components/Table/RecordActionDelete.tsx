import React from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { FileItem } from "@webiny/app-admin/types";
import { SearchRecordItem } from "@webiny/app-aco/types";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { useDeleteFile } from "~/hooks/useDeleteFile";

import { ListItemGraphic } from "./styled";

interface RecordActionDeleteProps {
    record: SearchRecordItem<FileItem>["data"];
}

export const RecordActionDelete: React.VFC<RecordActionDeleteProps> = ({ record }) => {
    const { canDelete } = useFileManagerApi();
    const { openDialogDeleteFile } = useDeleteFile({
        file: record
    });

    if (!canDelete(record)) {
        return null;
    }

    return (
        <MenuItem onClick={openDialogDeleteFile}>
            <ListItemGraphic>
                <Icon icon={<Delete />} />
            </ListItemGraphic>
            Delete
        </MenuItem>
    );
};
