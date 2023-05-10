import React from "react";
import mime from "mime/lite";
import styled from "@emotion/styled";

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

const FileTypesLabel = styled.div`
    padding: 10px;
`;

export interface SupportedFileTypesProps {
    accept: string[];
}

const SupportedFileTypes: React.VFC<SupportedFileTypesProps> = ({ accept }) => {
    if (!accept) {
        return null;
    }

    if (accept.length === 0) {
        return <FileTypesLabel>Showing all file extensions.</FileTypesLabel>;
    }

    return (
        <FileTypesLabel>
            Showing the following file extensions: {getUniqueFilePlugins(accept).join(", ")}.
        </FileTypesLabel>
    );
};

export default SupportedFileTypes;
