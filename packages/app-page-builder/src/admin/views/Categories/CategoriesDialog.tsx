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
import { LIST_CATEGORIES } from "./graphql";
import { PageBuilderListCategoriesResponse, PbCategory } from "~/types";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

export type CategoriesDialogProps = {
    open: boolean;
    onClose: DialogOnClose;
    onSelect: (item: PbCategory) => void;
    children: any;
};
interface ListCategoriesQueryResponse {
    data: PageBuilderListCategoriesResponse;
    loading?: boolean;
}
const CategoriesDialog = ({ open, onClose, onSelect, children }: CategoriesDialogProps) => {
    const { history } = useRouter();
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
                    <Query query={LIST_CATEGORIES}>
                        {({ data, loading }: ListCategoriesQueryResponse) => {
                            if (loading) {
                                return <span>Loading categories...</span>;
                            }

                            const categories = data?.pageBuilder?.listCategories?.data;
                            if (!categories) {
                                return <></>;
                            }
                            return (
                                <React.Fragment>
                                    {categories.map(item => (
                                        <ListItem
                                            key={item.slug}
                                            onClick={() => {
                                                onSelect(item);
                                                // @ts-expect-error
                                                onClose();
                                            }}
                                        >
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

export default CategoriesDialog;
