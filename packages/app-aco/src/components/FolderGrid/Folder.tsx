import React from "react";

import { ReactComponent as FolderIcon } from "@material-design-icons/svg/outlined/folder.svg";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/filled/more_vert.svg";
import { IconButton } from "@webiny/ui/Button";

import { ActionEdit } from "./ActionEdit";
import { ActionDelete } from "./ActionDelete";

import { Actions, FolderContainer, FolderContent, Text } from "./styled";

import { FolderItem } from "~/types";

export interface FolderProps {
    folder: FolderItem;
    onFolderClick: (folder: FolderItem) => void;
    onMenuEditClick: (folder: FolderItem) => void;
    onMenuDeleteClick: (folder: FolderItem) => void;
}

export const Folder: React.VFC<FolderProps> = ({
    folder,
    onFolderClick,
    onMenuEditClick,
    onMenuDeleteClick
}) => {
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
                <ActionEdit onClick={() => onMenuEditClick(folder)} />
                <ActionDelete onClick={() => onMenuDeleteClick(folder)} />
            </Actions>
        </FolderContainer>
    );
};
