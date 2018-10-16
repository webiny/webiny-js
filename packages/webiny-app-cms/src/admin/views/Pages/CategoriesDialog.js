// @flow
import React from "react";
import { compose } from "recompose";
import { css } from "emotion";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import { Dialog, DialogHeader, DialogHeaderTitle, DialogBody } from "webiny-ui/Dialog";
import {
    List,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "webiny-ui/List";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

const loadCategories = gql`
    query ListCategories($sort: JSON) {
        cms {
            listCategories(sort: $sort) {
                data {
                    id
                    name
                    url
                }
            }
        }
    }
`;

const CategoriesDialog = ({
    open,
    onClose,
    onSelect
}: {
    open: boolean,
    onClose: Function,
    onSelect: Function
}) => {
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <DialogHeader>
                <DialogHeaderTitle>Select a category</DialogHeaderTitle>
            </DialogHeader>
            <DialogBody>
                <List twoLine>
                    <Query query={loadCategories} variables={{ sort: { name: 1 } }}>
                        {({ data, loading }) => {
                            if (loading) {
                                return "Loading categories...";
                            }

                            return (
                                <React.Fragment>
                                    {data.cms.listCategories.data.map(item => (
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
            </DialogBody>
        </Dialog>
    );
};

export default CategoriesDialog;
