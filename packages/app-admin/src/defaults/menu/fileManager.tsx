import React from "react";
import { css } from "emotion";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as FileIcon } from "~/assets/icons/insert_drive_file-24px.svg";
import { FileManager } from "~/components";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";

const listItemStyle = css({
    ".mdc-list &.mdc-list-item:hover": {
        cursor: "pointer",
        backgroundColor: "var(--mdc-theme-background)"
    }
});

export default () => {
    return new NavigationViewPlugin(view => {
        const element = new NavigationMenuElement("fileManager", {
            label: "File Manager",
            icon: <FileIcon />,
            testId: "admin-drawer-footer-menu-file-manager"
        });

        element.setRenderer(() => {
            return (
                <FileManager>
                    {({ showFileManager }) => (
                        <ListItem
                            ripple={false}
                            onClick={showFileManager}
                            className={listItemStyle}
                            data-testid={element.config.testId}
                        >
                            <ListItemGraphic>
                                <Icon icon={element.config.icon} />
                            </ListItemGraphic>
                            {element.config.label}
                        </ListItem>
                    )}
                </FileManager>
            );
        });

        view.getFooterElement().addMenuElement(element);
    });
};
