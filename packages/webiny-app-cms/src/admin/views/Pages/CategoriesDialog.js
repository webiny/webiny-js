import React from "react";
import { compose } from "recompose";
import { css } from "emotion";
import { Dialog, DialogHeader, DialogHeaderTitle, DialogBody } from "webiny-ui/Dialog";
import {
    List,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "webiny-ui/List";
import { withDataList } from "webiny-app/components";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

class CategoriesDialog extends React.Component {
    render() {
        const { CategoriesDataList } = this.props;
        return (
            <Dialog open={this.props.open} onClose={this.props.onClose} className={narrowDialog}>
                <DialogHeader>
                    <DialogHeaderTitle>Select a category</DialogHeaderTitle>
                </DialogHeader>
                <DialogBody>
                    <List twoLine>
                        {CategoriesDataList.data.map(item => (
                            <ListItem key={item.id} onClick={() => this.props.onSelect(item)}>
                                <ListItemText>
                                    <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                    <ListItemTextSecondary>{item.url}</ListItemTextSecondary>
                                </ListItemText>
                            </ListItem>
                        ))}
                    </List>
                </DialogBody>
            </Dialog>
        );
    }
}

export default withDataList({
    name: "CategoriesDataList",
    type: "Cms.Categories",
    fields: "id name url",
    sort: { name: 1 }
})(CategoriesDialog);
