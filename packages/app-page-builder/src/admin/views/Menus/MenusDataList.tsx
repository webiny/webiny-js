import React, { useCallback, useMemo, useState } from "react";
import orderBy from "lodash/orderBy";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { LIST_MENUS, DELETE_MENU } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { PbMenu } from "~/types";
import { useMenusPermissions } from "~/hooks/permissions";

const t = i18n.ns("app-page-builder/admin/menus/data-list");

const SORTERS = [
    {
        label: t`Newest to oldest`,
        sort: "createdOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        sort: "createdOn_ASC"
    },
    {
        label: t`Title A-Z`,
        sort: "title_ASC"
    },
    {
        label: t`Title Z-A`,
        sort: "title_DESC"
    }
];

interface MenuDataListResponse {
    data: PbMenu[];
}

interface PageBuilderMenusDataListProps {
    canCreate: boolean;
}

const PageBuilderMenusDataList = ({ canCreate }: PageBuilderMenusDataListProps) => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState<string>(SORTERS[0].sort);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_MENUS);
    const [deleteIt, deleteMutation] = useMutation(DELETE_MENU, {
        refetchQueries: [{ query: LIST_MENUS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const filterMenus = useCallback(
        ({ title, slug, description }: PbMenu) => {
            return (
                title.toLowerCase().includes(filter) ||
                slug.toLowerCase().includes(filter) ||
                (description && description.toLowerCase().includes(filter))
            );
        },
        [filter]
    );

    const sortMenus = useCallback(
        (menus: PbMenu[]) => {
            if (!sort) {
                return menus;
            }
            const [field, order] = sort.split("_");
            return orderBy(menus, field, order.toLowerCase() as "asc" | "desc");
        },
        [sort]
    );

    const data = listQuery?.data?.pageBuilder?.listMenus?.data || [];
    const slug = new URLSearchParams(location.search).get("slug");

    const deleteItem = useCallback(
        (item: PbMenu) => {
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

    const { canDelete } = useMenusPermissions();

    const menusDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={"Sort menus by"}
                        >
                            {SORTERS.map(({ label, sort: value }) => {
                                return (
                                    <option key={label} value={value}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
    );

    const loading = [listQuery, deleteMutation].find(item => item.loading);

    const filteredData = filter === "" ? data : data.filter(filterMenus);
    const menuList = sortMenus(filteredData);

    return (
        <DataList
            loading={Boolean(loading)}
            data={menuList}
            title={t`Menus`}
            actions={
                canCreate ? (
                    <ButtonSecondary
                        data-testid="data-list-new-record-button"
                        onClick={() => history.push("/page-builder/menus?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`New Menu`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI value={filter} onChange={setFilter} inputPlaceholder={t`Search menus`} />
            }
            modalOverlay={menusDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
        >
            {({ data }: MenuDataListResponse) => (
                <ScrollList data-testid="default-data-list">
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

                            {canDelete(item?.createdBy?.id) && (
                                <ListItemMeta>
                                    <ListActions>
                                        <DeleteIcon
                                            onClick={() => deleteItem(item)}
                                            data-testid={"pb-menus-list-delete-menu-btn"}
                                        />
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
