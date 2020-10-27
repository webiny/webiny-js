import React, { useCallback, useMemo } from "react";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "react-apollo";
import { LIST_CATEGORIES, DELETE_CATEGORY } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useSecurity } from "@webiny/app-security";

const t = i18n.ns("app-page-builder/admin/categories/data-list");

const PageBuilderCategoriesDataList = () => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_CATEGORIES);
    const [deleteIt, deleteMutation] = useMutation(DELETE_CATEGORY, {
        refetchQueries: [{ query: LIST_CATEGORIES }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const data = listQuery?.data?.pageBuilder?.listCategories?.data || [];
    const slug = new URLSearchParams(location.search).get("slug");

    const deleteItem = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const error = response?.data?.pageBuilder?.deletePageBuilderCategory?.error;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Category "{slug}" deleted.`({ slug: item.slug }));

                if (slug === item.slug) {
                    history.push(`/page-builder/categories`);
                }
            });
        },
        [slug]
    );

    const { identity } = useSecurity();
    const pbMenuPermission = useMemo(() => {
        return identity.getPermission("pb.category");
    }, []);

    const canDelete = useCallback(item => {
        console.log('woah', item)
        if (pbMenuPermission.own) {
            return item.createdBy.id === identity.id;
        }

        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("d");
        }

        return true;
    }, []);

    const loading = [listQuery, deleteMutation].find(item => item.loading);

    return (
        <DataList
            loading={Boolean(loading)}
            data={data}
            title={t`Categories`}
            refresh={listQuery.refetch}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.slug} selected={item.slug === slug}>
                            <ListItemText
                                onClick={() =>
                                    history.push(`/page-builder/categories?slug=${item.slug}`)
                                }
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.url}</ListItemTextSecondary>
                            </ListItemText>

                            {canDelete(item) && (
                                <ListItemMeta>
                                    <ListActions>
                                        <DeleteIcon onClick={() => deleteItem(item)} />
                                    </ListActions>
                                </ListItemMeta>
                            )}
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default PageBuilderCategoriesDataList;
