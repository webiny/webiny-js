import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery, useMutation } from "react-apollo";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { LIST_GROUPS, DELETE_GROUP } from "./graphql";

const t = i18n.ns("app-security/admin/groups/data-list");

const GroupsDataList = () => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();

    const { data: listResponse, loading: listLoading, refetch } = useQuery(LIST_GROUPS);

    const [deleteIt, { loading: deleteLoading }] = useMutation(DELETE_GROUP, {
        refetchQueries: [{ query: LIST_GROUPS }]
    });

    const data = listLoading && !listResponse ? [] : listResponse.security.groups.data;
    const slug = new URLSearchParams(location.search).get("slug");

    const deleteItem = useCallback(
        item => {
            showConfirmation(async () => {
                const { data } = await deleteIt({
                    variables: item
                });

                const { error } = data.security.deleteGroup;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Group "{slug}" deleted.`({ slug: item.slug }));

                if (slug === item.slug) {
                    history.push(`/security/groups`);
                }
            });
        },
        [slug]
    );

    return (
        <DataList
            title={t`Security Groups`}
            data={data}
            refresh={refetch}
            loading={listLoading || deleteLoading}
        >
            {({ data }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem key={item.slug} selected={item.slug === slug}>
                            <ListItemText
                                onClick={() => history.push(`/security/groups?slug=${item.slug}`)}
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteItem(item)} />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default GroupsDataList;
