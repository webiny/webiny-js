import React, { Fragment } from "react";
import { ReactComponent as MoreVerticalIcon } from "@material-design-icons/svg/outlined/more_vert.svg";

import { useContentEntryEditorConfig } from "~/admin/config/contentEntries";

import { Menu, IconButton } from "./ContentFormOptionsMenu.styles";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";

interface ActionMenuItemProps {
    onAction: () => void;
    disabled?: boolean;
    dataTestId: string;
    icon: React.ReactElement<any>;
    label: string;
}

const ActionMenuItem = (props: ActionMenuItemProps) => {
    return (
        <MenuItem
            onClick={props.onAction}
            disabled={props.disabled ?? false}
            data-testid={props.dataTestId}
        >
            <ListItemGraphic>
                <Icon icon={props.icon} />
            </ListItemGraphic>
            {props.label}
        </MenuItem>
    );
};

interface MenuItemActionProviderProps {
    components: {
        MenuItem: typeof ActionMenuItem;
    };
    children: React.ReactNode;
}

interface MenuItemActionContext {
    MenuItem: typeof ActionMenuItem;
}

const MenuItemActionContext = React.createContext<MenuItemActionContext | undefined>(undefined);

const MenuItemActionProvider = ({ components, children }: MenuItemActionProviderProps) => {
    return (
        <MenuItemActionContext.Provider value={components}>
            {children}
        </MenuItemActionContext.Provider>
    );
};

function useMenuItemComponents() {
    return React.useContext(MenuItemActionContext);
}

export const ContentFormOptionsMenu: React.VFC = () => {
    const { form } = useContentEntryEditorConfig();

    if (!form.actions.length) {
        return null;
    }

    return (
        <Menu
            handle={
                <IconButton
                    icon={<MoreVerticalIcon />}
                    data-testid={"cms.content-form.header.more-options"}
                />
            }
        >
            {form.actions
                .filter(action => action.position === "tertiary")
                .map(action => (
                    <Fragment key={action.name}>
                        <MenuItemActionProvider components={{ MenuItem: ActionMenuItem }}>
                            {action.element}
                        </MenuItemActionProvider>
                    </Fragment>
                ))}
        </Menu>
    );
};
