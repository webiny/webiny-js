import React, { ReactElement } from "react";

import { ReactComponent as FolderIcon } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { IconButton } from "@webiny/ui/Button";

import { FolderActionEdit } from "../Actions/FolderActionEdit";
import { FolderActionDelete } from "../Actions/FolderActionDelete";

import { Actions, FolderContainer, FolderContent, Text } from "./styled";

import { FolderItem } from "~/types";

export interface FolderProps {
    folder: FolderItem;
    onFolderClick: (folder: FolderItem) => void;
    onMenuEditClick: (folder: FolderItem) => void;
    onMenuDeleteClick: (folder: FolderItem) => void;
}

export interface CreateFolderProps {
    onClick: () => void;
}

export const Folder = ({
    folder,
    onFolderClick,
    onMenuEditClick,
    onMenuDeleteClick
}: FolderProps): ReactElement => {
    const { title } = folder;
    return (
        <FolderContainer>
            <FolderContent onClick={() => onFolderClick(folder)}>
                <div>
                    <FolderIcon />
                </div>
                <Text use={"subtitle2"}>{title}</Text>
            </FolderContent>
            <Actions handle={<IconButton icon={<MoreIcon />} />}>
                <FolderActionEdit onClick={() => onMenuEditClick(folder)} />
                <FolderActionDelete onClick={() => onMenuDeleteClick(folder)} />
            </Actions>
        </FolderContainer>
    );
};
