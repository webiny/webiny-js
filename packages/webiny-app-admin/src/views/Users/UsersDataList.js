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
import { withSnackbar, type WithSnackbarProps } from "webiny-app-admin/components";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    ListItemGraphic
} from "webiny-ui/List";

import { DeleteIcon } from "webiny-ui/List/DataList/icons";

const t = i18n.namespace("Security.UsersDataList");

const UsersDataList = (
    props: WithRouterProps & WithSnackbarProps & { UsersDataList: WithDataListProps }
) => {
    const { UsersDataList, router } = props;

    return (
        <DataList
            {...UsersDataList}
            title={t`Security Users`}
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
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={router.getQuery("id") === item.id}>
                            <ListItemGraphic>
                                <img
                                    alt={t`User's avatar.`}
                                    width="32"
                                    height="32"
                                    src={item.avatar && item.avatar.src}
                                />
                            </ListItemGraphic>
                            <ListItemText
                                onClick={() =>
                                    router.goToRoute({ params: { id: item.id }, merge: true })
                                }
                            >
                                {item.fullName}
                                <ListItemTextSecondary>{item.email}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() => {
                                                    showConfirmation(() => {
                                                        UsersDataList.delete(item.id, {
                                                            onSuccess: () => {
                                                                UsersDataList.refresh();
                                                                props.showSnackbar(
                                                                    t`user {name} deleted.`({
                                                                        name: item.name
                                                                    })
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
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default compose(
    withSnackbar(),
    withRouter(),
    withDataList({
        name: "UsersDataList",
        type: "Security.Users",
        fields: "id email firstName lastName avatar { src } createdOn",
        sort: { savedOn: -1 }
    })
)(UsersDataList);
