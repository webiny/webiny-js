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
        Cms {
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

class CategoriesDialog extends React.Component {
    render() {
        return (
            <Dialog open={this.props.open} onClose={this.props.onClose} className={narrowDialog}>
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
                                        {data.Cms.listCategories.data.map(item => (
                                            <ListItem
                                                key={item.id}
                                                onClick={() => this.props.onSelect(item)}
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
                </DialogBody>
            </Dialog>
        );
    }
}

export default CategoriesDialog;
