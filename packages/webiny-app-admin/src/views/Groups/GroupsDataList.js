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
    ListActions
} from "webiny-ui/List";

import { DeleteIcon } from "webiny-ui/List/DataList/icons";

const t = i18n.namespace("Security.GroupsDataList");

const GroupsDataList = (
    props: WithRouterProps & WithSnackbarProps & { GroupsDataList: WithDataListProps }
) => {
    const { GroupsDataList, router } = props;

    console.log(GroupsDataList);
    return (
        <DataList
            {...GroupsDataList}
            title={t`Security Groups`}
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
                            <ListItemText
                                onClick={() =>
                                    router.goToRoute({ params: { id: item.id }, merge: true })
                                }
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() => {
                                                    showConfirmation(() => {
                                                        GroupsDataList.delete(item.id, {
                                                            onSuccess: () => {
                                                                GroupsDataList.refresh();
                                                                props.showSnackbar(
                                                                    t`group {name} deleted.`({
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
        name: "GroupsDataList",
        type: "Security.Groups",
        fields: "id name description createdOn",
        sort: { savedOn: -1 }
    })
)(GroupsDataList);
