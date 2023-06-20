import React from "react";
import get from "lodash/get";
import styled from "@emotion/styled";
import { FileItem } from "@webiny/app-admin/types";
import { useFile } from "~/hooks/useFile";
import getFileTypePlugin from "~/getFileTypePlugin";
import { CopyUrl } from "./actions/CopyUrl";
import { DeleteImage } from "./actions/DeleteImage";
import { Download } from "./actions/Download";
import { MoveTo } from "./actions/MoveTo";

const ActionsContainer = styled.div`
    text-align: center;
    border-bottom: 1px solid var(--mdc-theme-on-background);
`;

export const Actions = () => {
    const { file } = useFile();
    const filePlugin = getFileTypePlugin(file);

    // TODO: implement actions using component composition
    const actions: React.FC[] =
        get(filePlugin, "fileDetails.actions") || get(filePlugin, "actions") || [];

    return (
        <ActionsContainer>
            <Download />
            <MoveTo />
            <CopyUrl />
            {actions.map((Component: React.FC<{ file: FileItem }>, index: number) => (
                <Component key={index} file={file} />
            ))}
            <DeleteImage />
        </ActionsContainer>
    );
};
