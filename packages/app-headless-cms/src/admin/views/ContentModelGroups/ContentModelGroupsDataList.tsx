import React, { useCallback } from "react";
import get from "lodash/get";
import dotProp from "dot-prop-immutable";
import { i18n } from "@webiny/app/i18n";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery, useApolloClient } from "@webiny/app-headless-cms/admin/hooks";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import * as GQL from "./graphql";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/data-list");

const ContentModelGroupsDataList = () => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const listQuery = useQuery(GQL.LIST_CONTENT_MODEL_GROUPS);

    const { showConfirmation } = useConfirmationDialog();

    const data = listQuery.loading ? [] : get(listQuery, "data.listContentModelGroups.data", []);
    const groupId = new URLSearchParams(location.search).get("id");

    const deleteItem = useCallback(
        group => {
            showConfirmation(async () => {
                const response = await client.mutate({
                    mutation: GQL.DELETE_CONTENT_MODEL_GROUP,
                    variables: { id: group.id },
                    update(cache, { data }) {
                        const { error } = data.deleteContentModelGroup;
                        if (error) {
                            return;
                        }

                        // Delete the item from list cache
                        const gqlParams = { query: GQL.LIST_CONTENT_MODEL_GROUPS };
                        const { listContentModelGroups } = cache.readQuery(gqlParams);
                        const index = listContentModelGroups.data.findIndex(
                            item => item.id === group.id
                        );

                        cache.writeQuery({
                            ...gqlParams,
                            data: {
                                listContentModelGroups: dotProp.delete(
                                    listContentModelGroups,
                                    `data.${index}`
                                )
                            }
                        });
                    }
                });

                const { error } = response.data.deleteContentModelGroup;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Content model group "{name}" deleted.`({ name: group.name }));

                if (groupId === group.id) {
                    history.push(`/cms/content-model-groups`);
                }
            });
        },
        [groupId]
    );

    return (
        <DataList
            loading={listQuery.loading}
            data={data}
            title={t`Content Model Groups`}
            refresh={listQuery.refetch}
            sorters={[
                {
                    label: t`Newest to oldest`,
                    sorters: { createdOn: -1 }
                },
                {
                    label: t`Oldest to newest`,
                    sorters: { createdOn: 1 }
                },
                {
                    label: t`Name A-Z`,
                    sorters: { name: 1 }
                },
                {
                    label: t`Name Z-A`,
                    sorters: { name: -1 }
                }
            ]}
        >
            {({ data }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === groupId}>
                            <ListItemText
                                onClick={() =>
                                    history.push(`/cms/content-model-groups?id=${item.id}`)
                                }
                            >
                                {item.name}
                                <ListItemTextSecondary>
                                    {item.contentModels.length
                                        ? t`{contentModels|count:1:content model:default:content models}`(
                                              {
                                                  contentModels: item.contentModels.length
                                              }
                                          )
                                        : t`No content models`}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteItem(item)} />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
};

export default ContentModelGroupsDataList;
