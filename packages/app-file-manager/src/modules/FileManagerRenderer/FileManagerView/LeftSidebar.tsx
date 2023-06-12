import React from "react";
import { FolderTree } from "@webiny/app-aco";
import { css } from "emotion";

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
    currentFolder?: string;
    onFolderClick: (folderId: string | undefined) => void;
    children?: React.ReactNode;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
    title,
    currentFolder,
    onFolderClick,
    children
}) => {
    return (
        <div className={style.leftDrawer}>
            <div className={style.wrapper}>
                <FolderTree
                    title={title}
                    focusedFolderId={currentFolder}
                    onTitleClick={() => onFolderClick("ROOT")}
                    onFolderClick={data => data?.id && onFolderClick(data?.id)}
                    enableActions={true}
                    enableCreate={true}
                />
                <div className={style.divider} />
                {children}
            </div>
        </div>
    );
};
