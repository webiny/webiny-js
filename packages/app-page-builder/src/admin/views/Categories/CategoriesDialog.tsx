import React from "react";
import { css } from "emotion";
import { withRouter, WithRouterProps } from "@webiny/react-router";
import { Query } from "react-apollo";
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
import { LIST_CATEGORIES_BY_NAME } from "./graphql";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

export type CategoriesDialogProps = WithRouterProps<{
    open: boolean;
    onClose: DialogOnClose;
    onSelect: Function;
    history: History;
    children: any;
}>;

const CategoriesDialog: React.FC<CategoriesDialogProps> = ({
    open,
    onClose,
    onSelect,
    history,
    children
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="pb-new-page-category-modal"
        >
            {children}
            <DialogTitle>Select a category</DialogTitle>
            <DialogContent>
                <List twoLine>
                    <Query query={LIST_CATEGORIES_BY_NAME}>
                        {({ data, loading }) => {
                            if (loading) {
                                return <span>Loading categories...</span>;
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

export default withRouter<CategoriesDialogProps>(CategoriesDialog);
