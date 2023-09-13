import React, { useCallback } from "react";
import { Image } from "@webiny/app/components";
import {
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    ListItemGraphic
} from "@webiny/ui/List";
import { Avatar } from "@webiny/ui/Avatar";
import { Menu, MenuItem, MenuDivider } from "@webiny/ui/Menu";
import { ReactComponent as More } from "@material-design-icons/svg/outlined/arrow_drop_down.svg";

interface UsersTeamsSelectionProps {
    data: any[];
    onRemoveAccess: any;
}

const UsersTeamsSelection: React.FC<UsersTeamsSelectionProps> = ({ data = [], onRemoveAccess }) => {
    const removeAccess = useCallback((item) => {
        onRemoveAccess(item);
    }, []);

    console.log("data123123123", data);
    return (
        <ScrollList twoLine avatarList style={{ height: 300 }}>
            {data.map(item => (
                <ListItem key={item.user.id}>
                    <ListItemGraphic>
                        <Avatar
                            renderImage={props => <Image {...props} transform={{ width: 100 }} />}
                            src={item.user.avatar ? item.user.avatar.src : item.user.gravatar}
                            fallbackText={item.user.firstName}
                            alt={"User's avatar."}
                        />
                    </ListItemGraphic>
                    <ListItemText>
                        {item.user.firstName} {item.user.lastName}
                        <ListItemTextSecondary>{item.user.email}</ListItemTextSecondary>
                    </ListItemText>

                    <ListItemMeta>
                        <ListActions>
                            <Menu
                                handle={
                                    <div>
                                        Owner <More />
                                    </div>
                                }
                                renderToPortal={true}
                            >
                                <MenuItem onClick={() => console.log("Viewer")}>
                                    Viewer
                                    <span style={{ fontSize: 10 }}>
                                        Can view content, but not modify it
                                    </span>
                                </MenuItem>
                                <MenuItem onClick={() => console.log("Editor")}>
                                    Editor
                                    <span style={{ fontSize: 10 }}>
                                        Can view and modify content
                                    </span>
                                </MenuItem>
                                <MenuItem onClick={() => console.log("Owner")}>
                                    Owner
                                    <span style={{ fontSize: 10 }}>
                                        Can edit and manage content permissions
                                    </span>
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem onClick={removeAccess}>Remove access</MenuItem>
                            </Menu>
                        </ListActions>
                    </ListItemMeta>
                </ListItem>
            ))}
        </ScrollList>
    );
};

export default UsersTeamsSelection;
