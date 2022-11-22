import React, { ReactElement, useCallback } from "react";

import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FolderItem } from "@webiny/app-folders/types";
import { i18n } from "@webiny/app/i18n";
import { MenuItem } from "@webiny/ui/Menu";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/folder/delete");

interface Props {
    folder: FolderItem;
    deleteFolder: (folder: FolderItem) => Promise<boolean>;
}
export const FolderActionDelete = ({ folder, deleteFolder }: Props): ReactElement => {
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

    if (!folder) {
        return <></>;
    }

    return <MenuItem onClick={onDeleteFolder}>{t`Delete`}</MenuItem>;
};
