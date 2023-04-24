import React from "react";

import { i18n } from "@webiny/app/i18n";
import { FolderTree, TagList } from "@webiny/app-aco";
import { css } from "emotion";

import { ACO_TYPE, DEFAULT_SCOPE } from "~/constants";

import { TagItem } from "@webiny/app-aco/types";

const t = i18n.ns("app-file-manager/modules/renderer/left-sidebar");

const style = {
    leftDrawer: css({
        float: "left",
        display: "inline-block",
        width: 249,
        height: "100%",
        backgroundColor: "var(--mdc-theme-surface)",
        padding: 10,
        borderRight: "1px solid var(--mdc-theme-on-background)"
    }),
    divider: css({
        height: "1px",
        backgroundColor: "var(--mdc-theme-on-background)",
        margin: "12px 8px"
    })
};

interface LeftSidebarProps {
    title: string;
    toggleTag: (tag: TagItem) => void;
    currentFolder?: string;
    scope?: string;
    onFolderClick: (folderId: string | undefined) => void;
}

const getInitialWhere = (scope: string | undefined) => {
    let scopeFilter = {};

    if (!scope) {
        scopeFilter = {
            tags_not_startsWith: DEFAULT_SCOPE
        };
    } else {
        scopeFilter = {
            tags_startsWith: scope
        };
    }

    return {
        AND: [{ tags_not_startsWith: "mime:" }, scopeFilter]
    };
};

const LeftSidebar = ({
    title,
    toggleTag,
    currentFolder,
    scope,
    onFolderClick
}: LeftSidebarProps) => {
    const tagsModifier = (tags: TagItem[]) => {
        const tagsWithoutMime = tags.filter(tag => !tag.name.startsWith("mime:"));
        if (scope) {
            return tagsWithoutMime;
        }

        return tagsWithoutMime
            .filter(tag => tag.name !== scope)
            .map(tag => {
                return scope
                    ? {
                          ...tag,
                          name: tag.name.replace(`${scope}:`, "")
                      }
                    : tag;
            });
    };

    return (
        <div className={style.leftDrawer}>
            <FolderTree
                type={ACO_TYPE}
                title={title}
                focusedFolderId={currentFolder}
                onTitleClick={() => onFolderClick(undefined)}
                onFolderClick={data => data?.id && onFolderClick(data?.id)}
                enableActions={true}
                enableCreate={true}
            />
            <div className={style.divider} />
            <TagList
                type={ACO_TYPE}
                initialWhere={getInitialWhere(scope)}
                tagsModifier={tagsModifier}
                emptyDisclaimer={t`No tag found: once you tag a file, it will be displayed here.`}
                onTagClick={tag => toggleTag(tag)}
            />
        </div>
    );
};

export default LeftSidebar;
