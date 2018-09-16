// @flow
import * as React from "react";
import {
    withDataList,
    withRouter,
    type WithRouterProps,
    type WithDataListProps
} from "webiny-app/components";
import { i18n } from "webiny-app/i18n";
import { compose } from "recompose";

import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta
} from "webiny-ui/List";
import { DeleteIcon } from "webiny-ui/List/DataList/icons";
import { withSnackbar, type WithSnackbarProps } from "webiny-app-admin/components";

const t = i18n.namespace("Security.ApiTokensList");

const ApiTokensDataList = (
    props: WithRouterProps & WithSnackbarProps & { ApiTokensList: WithDataListProps }
) => {
    const { ApiTokensList, router } = props;

    return (
        <DataList
            {...ApiTokensList}
            title={t`API Tokens`}
            sorters={[
                {
                    label: "Newest to oldest",
                    sorters: { savedOn: -1 }
                },
                {
                    label: "Oldest to newest",
                    sorters: { savedOn: 1 }
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
                        <ListItem key={item.id} selected={router.getQuery("id") === item.id}>
                            <ListItemText
                                onClick={() => {
                                    router.goToRoute({
                                        merge: true,
                                        params: {
                                            id: item.id
                                        }
                                    });
                                }}
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <ConfirmationDialog>
                                    {({ showConfirmation }) => (
                                        <DeleteIcon
                                            onClick={() => {
                                                showConfirmation(() => {
                                                    ApiTokensList.delete(item.id, {
                                                        onSuccess: () => {
                                                            ApiTokensList.refresh();
                                                            props.showSnackbar(
                                                                t`API token deleted.`
                                                            );
                                                            item.id === router.getQuery().id &&
                                                                router.goToRoute({
                                                                    params: { id: null },
                                                                    merge: true
                                                                });
                                                        }
                                                    });
                                                });
                                            }}
                                        />
                                    )}
                                </ConfirmationDialog>
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
        name: "ApiTokensList",
        type: "Security.ApiTokens",
        fields: "id name description slug createdOn",
        sort: { savedOn: -1 }
    })
)(ApiTokensDataList);
