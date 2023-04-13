import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";

import React, { ReactElement } from "react";

import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { useDeleteFile } from "~/modules/Hooks/useDeleteFile";

import { ListItemGraphic } from "~/modules/FileManagerRenderer/DefaultRenderer/Table/styled";

import { useFile } from "~/components/FileDetails/FileProvider";
import { FileItem } from "@webiny/app/types";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/delete");

interface RecordActionDeleteProps {
    record: FileItem;
}
export const RecordActionDelete = ({ record }: RecordActionDeleteProps): ReactElement => {
    //const { file } = useFile();
    const { canEdit } = useFileManagerApi();
    const { openDialogDeleteFile } = useDeleteFile({
        onDelete: () => console.log("qui"),
        file: record
    });

    if (!canEdit(record as FileItem)) {
        console.log("Does not have permission to delete file.");
        return <></>;
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
