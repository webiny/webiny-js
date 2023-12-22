import React from "react";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";
import { Query } from "@apollo/react-components";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogOnClose
} from "@webiny/ui/Dialog";
import {
    List,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { ButtonDefault } from "@webiny/ui/Button";
import { LIST_MENUS } from "./graphql";
import { PbMenu } from "~/types";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

interface ListMenusResponse {
    data: {
        pageBuilder: {
            menus: {
                data: PbMenu[];
            };
        };
    };
    loading: boolean;
}

export interface MenusDialogProps {
    open: boolean;
    onClose: DialogOnClose;
    onSelect: (item: PbMenu) => void;
    children: any;
}

const MenusDialog = ({ open, onClose, onSelect, children }: MenusDialogProps) => {
    const { history } = useRouter();
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="pb-new-page-menu-modal"
        >
            {children}
            <DialogTitle>Select a menu</DialogTitle>
            <DialogContent>
                <List twoLine>
                    <Query query={LIST_MENUS}>
                        {({ data, loading }: ListMenusResponse) => {
                            if (loading) {
                                return <span>Loading menus...</span>;
                            }

                            return (
                                <React.Fragment>
                                    {data.pageBuilder.menus.data.map(item => (
                                        <ListItem key={item.id} onClick={() => onSelect(item)}>
                                            <ListItemText>
                                                <ListItemTextPrimary>
                                                    {item.name}
                                                </ListItemTextPrimary>
                                                <ListItemTextSecondary>
                                                    {item.url}
                                                </ListItemTextSecondary>
                                            </ListItemText>
                                        </ListItem>
                                    ))}
                                </React.Fragment>
                            );
                        }}
                    </Query>
                </List>
            </DialogContent>
            <DialogActions>
                <ButtonDefault onClick={() => history.push("/page-builder/menus")}>
                    + Create new menu
                </ButtonDefault>
            </DialogActions>
        </Dialog>
    );
};

export default MenusDialog;
