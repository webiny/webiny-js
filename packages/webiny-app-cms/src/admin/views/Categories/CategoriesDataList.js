// @flow
import * as React from "react";
import { withDataList, withRouter } from "webiny-app/components";
import { i18n } from "webiny-app/i18n";
import { compose } from "recompose";
import { withSnackbar } from "webiny-app-admin/components/withSnackbar";

import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "webiny-ui/List";

import { DeleteIcon } from "webiny-ui/List/DataList/icons";

const t = i18n.namespace("Cms.CategoriesDataList");

const CategoriesDataList = props => {
    const { CategoriesDataList, router, showSnackbar } = props;

    return (
        <DataList
            {...CategoriesDataList}
            title={t`CMS Categories`}
            sorters={[
                {
                    label: "Newest to oldest",
                    sorters: { createdOn: -1 }
                },
                {
                    label: "Oldest to newest",
                    sorters: { createdOn: 1 }
                },
                {
                    label: "Name A-Z",
                    sorters: { name: 1 }
                },
                {
                    label: "Name Z-A",
                    sorters: { name: -1 }
                }
            ]}
        >
            {({ data }) => (
                <List>
                    {data.map(item => (
                        <ListItem key={item.id}>
                            <ListItemText
                                onClick={() =>
                                    router.goToRoute({ params: { id: item.id }, merge: true })
                                }
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.url}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() => {
                                                    showConfirmation(() => {
                                                        CategoriesDataList.delete(item.id, {
                                                            onSuccess: () => {
                                                                CategoriesDataList.refresh();
                                                                showSnackbar(
                                                                    t`Category {name} deleted.`({
                                                                        name: item.name
                                                                    })
                                                                );
                                                            }
                                                        });
                                                    });
                                                }}
                                            />
                                        )}
                                    </ConfirmationDialog>
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
};

export default compose(
    withSnackbar(),
    withRouter(),
    withDataList({
        name: "CategoriesDataList",
        type: "Cms.Categories",
        fields: "id name slug url layout",
        sort: { savedOn: -1 }
    })
)(CategoriesDataList);
