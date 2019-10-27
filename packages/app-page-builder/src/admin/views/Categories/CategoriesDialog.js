// @flow
import React from "react";
import { css } from "emotion";
import { withRouter } from "react-router-dom";
import type { RouterHistory } from "react-router-dom";
import { Query } from "react-apollo";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@webiny/ui/Dialog";
import {
    List,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { ButtonDefault } from "@webiny/ui/Button";
import { LIST_CATEGORIES } from "./graphql";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

const CategoriesDialog = ({
    open,
    onClose,
    onSelect,
    history,
    children
}: {
    open: boolean,
    onClose: Function,
    onSelect: Function,
    history: RouterHistory,
    children: any
}) => {
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            {children}
            <DialogTitle>Select a category</DialogTitle>
            <DialogContent>
                <List twoLine>
                    <Query query={LIST_CATEGORIES} variables={{ sort: { name: 1 } }}>
                        {({ data, loading }) => {
                            if (loading) {
                                return "Loading categories...";
                            }

                            return (
                                <React.Fragment>
                                    {data.pageBuilder.categories.data.map(item => (
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
                <ButtonDefault onClick={() => history.push("/page-builder/categories")}>
                    + Create new category
                </ButtonDefault>
            </DialogActions>
        </Dialog>
    );
};

export default withRouter(CategoriesDialog);
