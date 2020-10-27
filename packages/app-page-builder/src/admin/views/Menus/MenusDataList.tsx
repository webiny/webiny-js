import React, { useCallback, useMemo } from "react";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "react-apollo";
import { LIST_MENUS, DELETE_MENU } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useSecurity } from "@webiny/app-security";

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

const t = i18n.ns("app-page-builder/admin/menus/data-list");

const PageBuilderMenusDataList = () => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_MENUS);
    const [deleteIt, deleteMutation] = useMutation(DELETE_MENU, {
        refetchQueries: [{ query: LIST_MENUS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const data = listQuery?.data?.pageBuilder?.listMenus?.data || [];
    const slug = new URLSearchParams(location.search).get("slug");

    const deleteItem = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const error = response?.data?.pageBuilder?.deletePageBuilderMenu?.error;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Menu "{slug}" deleted.`({ slug: item.slug }));

                if (slug === item.slug) {
                    history.push(`/page-builder/menus`);
                }
            });
        },
        [slug]
    );

    const { identity } = useSecurity();
    const pbMenuPermission = useMemo(() => {
        return identity.getPermission("pb.menu");
    }, []);

    const canDelete = useCallback(item => {
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
            title={t`Menus`}
            refresh={listQuery.refetch}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.slug} selected={item.slug === slug}>
                            <ListItemText
                                onClick={() =>
                                    history.push(`/page-builder/menus?slug=${item.slug}`)
                                }
                            >
                                {item.title}
                                <ListItemTextSecondary>
                                    {item.description || t`No description provided.`}
                                </ListItemTextSecondary>
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

export default PageBuilderMenusDataList;
