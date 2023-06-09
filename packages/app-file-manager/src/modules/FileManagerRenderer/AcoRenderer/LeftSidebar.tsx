import React from "react";
import { i18n } from "@webiny/app/i18n";
import { FolderTree, TagList } from "@webiny/app-aco";
import { css } from "emotion";
import { getTagsInitialParams, tagsModifier } from "~/tagsHelpers";
import { FOLDER_ID_DEFAULT } from "~/constants";
import { TagItem } from "@webiny/app-aco/types";

const t = i18n.ns("app-file-manager/modules/renderer/left-sidebar");

const style = {
    leftDrawer: css({
        float: "left",
        display: "block",
        width: 269,
        height: "calc(100vh - 64px)",
        backgroundColor: "var(--mdc-theme-surface)",
        borderRight: "1px solid var(--mdc-theme-on-background)",
        overflowY: "scroll"
    }),
    wrapper: css({
        padding: " 16px 8px"
    }),
    divider: css({
        height: "1px",
        backgroundColor: "var(--mdc-theme-on-background)",
        margin: "12px 8px 16px"
    })
};

interface LeftSidebarProps {
    title: string;
    toggleTag: (tag: TagItem) => void;
    currentFolder?: string;
    scope?: string;
    own?: boolean;
    onFolderClick: (folderId: string | undefined) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
    title,
    toggleTag,
    currentFolder,
    scope,
    own,
    onFolderClick
}) => {
    return (
        <div className={style.leftDrawer}>
            <div className={style.wrapper}>
                <FolderTree
                    title={title}
                    focusedFolderId={currentFolder}
                    onTitleClick={() => onFolderClick(FOLDER_ID_DEFAULT)}
                    onFolderClick={data => data?.id && onFolderClick(data?.id)}
                    enableActions={true}
                    enableCreate={true}
                />
                <div className={style.divider} />
                <TagList
                    initialWhere={getTagsInitialParams({ scope, own })}
                    tagsModifier={tagsModifier(scope)}
                    emptyDisclaimer={t`No tag found: once you tag a file, it will be displayed here.`}
                    onTagClick={tag => toggleTag(tag)}
                />
            </div>
        </div>
    );
};

export default LeftSidebar;
