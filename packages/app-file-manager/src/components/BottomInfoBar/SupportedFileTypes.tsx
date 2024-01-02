import React from "react";
import { i18n } from "@webiny/app/i18n";
import mime from "mime/lite";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

const t = i18n.ns("app-admin/file-manager/components/bottom-info-bar/supported-files");

const getUniqueFilePlugins = (accept: string[]): string[] => {
    const exts: Record<string, boolean> = {};
    accept.forEach(item => {
        const ext = mime.getExtension(item);
        if (!ext) {
            return;
        }
        exts[ext] = true;
    });

    return Object.keys(exts);
};

export interface SupportedFileTypesProps {
    accept: string[];
}

const SupportedFileTypes = ({ accept }: SupportedFileTypesProps) => {
    if (!accept) {
        return null;
    }

    if (accept.length === 0) {
        return <span>{t`Showing all file extensions.`}</span>;
    }

    return (
        <span>
            {t`Showing the following file extensions: {files}.`({
                files: getUniqueFilePlugins(accept).join(", ")
            })}
        </span>
    );
};

export default SupportedFileTypes;
