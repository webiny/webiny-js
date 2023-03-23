import React from "react";
import mime from "mime/lite";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

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

const SupportedFileTypes: React.VFC<SupportedFileTypesProps> = ({ accept }) => {
    if (!accept) {
        return null;
    }

    if (accept.length === 0) {
        return <span>Showing all file extensions.</span>;
    }

    return (
        <span>
            Showing the following file extensions: {getUniqueFilePlugins(accept).join(", ")}.
        </span>
    );
};

export default SupportedFileTypes;
