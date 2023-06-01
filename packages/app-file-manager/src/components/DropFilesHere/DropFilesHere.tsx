import React from "react";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";

import {
    DropFilesHereWrapper,
    DropFilesHereInner,
    DropFilesHereIcon,
    DropFilesHereIconWrapper
} from "./styled";

const t = i18n.ns("app-admin/file-manager/components/drop-files-here");

export interface DropFilesHereProps {
    onDragLeave?: (event?: React.DragEvent<HTMLElement>) => void;
    onDrop?: (event?: React.DragEvent<HTMLElement>) => void;
    empty?: boolean;
    onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
}

export const DropFilesHere: React.FC<DropFilesHereProps> = ({
    onDrop,
    onDragLeave,
    empty,
    onClick
}) => {
    return (
        <DropFilesHereWrapper
            empty={empty}
            onDrop={onDrop}
            onClick={onClick}
            onDragLeave={onDragLeave}
        >
            <DropFilesHereInner empty={empty}>
                <DropFilesHereIconWrapper>
                    <Icon icon={<DropFilesHereIcon />} />
                    <div>{t`Drop files here`}</div>
                </DropFilesHereIconWrapper>
            </DropFilesHereInner>
        </DropFilesHereWrapper>
    );
};
