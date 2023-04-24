import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import { useFileManagerAcoView } from "~/modules/FileManagerRenderer/FileManagerAcoViewProvider";
import { FileItem } from "@webiny/app-admin/types";

const t = i18n.ns("app-admin/file-manager/file-manager-view/hooks/file/copy");

interface UseCopyFileParams {
    file: {
        key: FileItem["key"];
        src?: FileItem["src"];
    };
}

export const useCopyFile = ({ file }: UseCopyFileParams) => {
    const { settings } = useFileManagerAcoView();
    const { showSnackbar } = useSnackbar();

    const copyFileUrl = useCallback(() => {
        const fileSrc = file.src || settings?.srcPrefix + file.key;

        navigator.clipboard.writeText(fileSrc);
        showSnackbar(t`URL copied successfully.`);
    }, [file]);

    return {
        copyFileUrl
    };
};
