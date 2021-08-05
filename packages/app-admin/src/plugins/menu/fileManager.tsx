import React from "react";
import { css } from "emotion";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as FileIcon } from "~/assets/icons/insert_drive_file-24px.svg";
import { FileManager } from "~/components";
import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";
import { UIRenderer, UIRenderParams } from "~/ui/UIRenderer";
import { UIViewPlugin } from "~/ui/UIView";
import { NavigationView } from "~/ui/views/NavigationView";

const listItemStyle = css({
    ".mdc-list &.mdc-list-item:hover": {
        cursor: "pointer",
        backgroundColor: "var(--mdc-theme-background)"
    }
});

class FileManagerMenuItemRenderer extends UIRenderer<NavigationMenuElement> {
    render({ element }: UIRenderParams<NavigationMenuElement>): React.ReactNode {
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
    }
}

export default () => {
    return [
        new UIViewPlugin<NavigationView>(NavigationView, view => {
            const element = new NavigationMenuElement("fileManager", {
                label: "File Manager",
                icon: <FileIcon />,
                testId: "admin-drawer-footer-menu-file-manager"
            });

            element.addRenderer(new FileManagerMenuItemRenderer());

            view.getFooterElement().addMenuElement(element);
        })
    ];
};
