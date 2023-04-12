import React from "react";

import { i18n } from "@webiny/app/i18n";
import { FolderTree, TagList } from "@webiny/app-aco";
import { css } from "emotion";

import { FOLDER_TYPE } from "~/constants/folders";

import { TagItem } from "@webiny/app-aco/types";

const t = i18n.ns("app-file-manager/modules/renderer/left-sidebar");

const style = {
    leftDrawer: css({
        float: "left",
        display: "inline-block",
        width: 250,
        height: "100%",
        backgroundColor: "var(--mdc-theme-surface)",
        padding: 10
    }),
    divider: css({
        height: "1px",
        backgroundColor: "var(--mdc-theme-on-background)",
        margin: "12px 8px"
    })
};

interface LeftSidebarProps {
    toggleTag: (tag: TagItem) => void;
}
const LeftSidebar = ({ toggleTag }: LeftSidebarProps) => {
    return (
        <div className={style.leftDrawer}>
            <FolderTree
                type={FOLDER_TYPE}
                title={"All files"}
                focusedFolderId={"12345678"}
                onTitleClick={() => console.log("title click")}
                onFolderClick={data => data?.id && console.log(data?.id)}
                enableActions={true}
                enableCreate={true}
            />
            <div className={style.divider} />
            <TagList
                type={FOLDER_TYPE}
                emptyDisclaimer={t`No tag found: once you tag a file, the tag will be displayed here.`}
                onTagClick={tag => toggleTag(tag)}
            />
        </div>
    );
};

export default LeftSidebar;
