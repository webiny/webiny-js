import React, { useCallback } from "react";

import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { i18n } from "@webiny/app/i18n";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { useSnackbar } from "@webiny/app-admin";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { MovableSearchRecordItem } from "@webiny/app-aco/types";

import { ListItemGraphic } from "./styled";

const t = i18n.ns("app-admin/file-manager/components/table/record-action-move");

interface RecordActionMoveProps {
    record: MovableSearchRecordItem;
}

export const RecordActionMove: React.VFC<RecordActionMoveProps> = ({ record }) => {
    const { showDialog } = useMoveToFolderDialog();
    const { showSnackbar } = useSnackbar();

    const onAccept = async (data: any) => {
        try {
            showSnackbar(
                t`File "{id}" moved successfully into "{folderId}"!`({
                    id: record.id,
                    folderId: data.folder.id
                })
            );
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    const openDialogMoveFile = useCallback(
        () =>
            showDialog({
                title: t`Move File`,
                message: t`Choose the folder where you want to move the file. You can always create a new one if you prefer.`,
                loadingLabel: t`Moving file...`,
                focusedFolderId: record.location.folderId,
                onAccept
            }),
        [record]
    );

    return (
        <MenuItem onClick={openDialogMoveFile}>
            <ListItemGraphic>
                <Icon icon={<Move />} />
            </ListItemGraphic>
            {t`Move`}
        </MenuItem>
    );
};
