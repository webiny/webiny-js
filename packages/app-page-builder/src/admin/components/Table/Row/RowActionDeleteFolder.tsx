import React, { useCallback } from "react";

import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { MenuItem } from "@webiny/ui/Menu";
import { FolderItem } from "@webiny/app-folders/types";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/edit");

interface DeleteFolderProps {
    folder: FolderItem;
    deleteFolder: (folder: FolderItem) => Promise<boolean>;
}
const RowActionDeleteFolder: React.FC<DeleteFolderProps> = props => {
    const { folder, deleteFolder } = props;
    const { showSnackbar } = useSnackbar();

    const onDeleteFolder = useCallback(async () => {
        const result = await deleteFolder(folder);

        if (result) {
            showSnackbar(
                t`The page "{title}" was deleted successfully.`({
                    title: `${
                        folder.name.length > 20
                            ? folder.name.slice(0, 20).concat("...")
                            : folder.name
                    }`
                })
            );
        } else {
            showSnackbar(
                t`Error while deleting page "{title}"!`({
                    title: `${
                        folder.name.length > 20
                            ? folder.name.slice(0, 20).concat("...")
                            : folder.name
                    }`
                })
            );
        }
    }, [folder]);

    return <MenuItem onClick={onDeleteFolder}>{t`Delete`}</MenuItem>;
};

export default RowActionDeleteFolder;
