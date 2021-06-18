import React from "react";
import { css } from "emotion";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { AdminDrawerFooterMenuPlugin } from "../../types";
import { ReactComponent as FileIcon } from "../../assets/icons/insert_drive_file-24px.svg";

import { i18n } from "@webiny/app/i18n";
import { FileManager } from "../../components";

const t = i18n.ns("app-admin/navigation");

const listItemStyle = css({
    ".mdc-list &.mdc-list-item:hover": {
        cursor: "pointer",
        backgroundColor: "var(--mdc-theme-background)"
    }
});

export default (): AdminDrawerFooterMenuPlugin => ({
    type: "admin-drawer-footer-menu",
    name: "admin-drawer-footer-menu-file-manager",
    render() {
        return (
            <>
                <FileManager>
                    {({ showFileManager }) => (
                        <ListItem
                            ripple={false}
                            onClick={showFileManager}
                            className={listItemStyle}
                            data-testid={"admin-drawer-footer-menu-file-manager"}
                        >
                            <ListItemGraphic>
                                <Icon icon={<FileIcon />} />
                            </ListItemGraphic>
                            {t`File Manager`}
                        </ListItem>
                    )}
                </FileManager>
            </>
        );
    }
});
