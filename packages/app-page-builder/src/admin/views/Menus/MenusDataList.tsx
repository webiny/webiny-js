import React, { useCallback, useMemo, useState } from "react";
import classNames from "classnames";
import { css } from "emotion";
import orderBy from "lodash/orderBy";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "react-apollo";
import { LIST_MENUS, DELETE_MENU } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useSecurity } from "@webiny/app-security";

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
import { ButtonDefault, ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Form } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { serializeSorters, deserializeSorters } from "../utils";

const t = i18n.ns("app-page-builder/admin/menus/data-list");
const activeIcon = css({
    "&": {
        color: "var(--mdc-theme-primary)"
    }
});
const resetButtonStyle = css({
    "&.mdc-button:not(disabled)": {
        color: "var(--mdc-theme-text-primary-on-background)",
        border: "1px solid var(--mdc-theme-on-background)"
    },
    "&.mdc-button:disabled": {
        color: "rgba(0, 0, 0, 0.37)"
    }
});

const SORTERS = [
    {
        label: t`Newest to oldest`,
        sorters: { createdOn: "desc" }
    },
    {
        label: t`Oldest to newest`,
        sorters: { createdOn: "asc" }
    },
    {
        label: t`Title A-Z`,
        sorters: { title: "asc" }
    },
    {
        label: t`Title Z-A`,
        sorters: { title: "desc" }
    }
];

type PageBuilderMenusDataListProps = {
    canCreate: boolean;
};
const PageBuilderMenusDataList = ({ canCreate }: PageBuilderMenusDataListProps) => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(null);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_MENUS);
    const [deleteIt, deleteMutation] = useMutation(DELETE_MENU, {
        refetchQueries: [{ query: LIST_MENUS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const filterMenus = useCallback(
        ({ title, slug, description }) => {
            return (
                title.toLowerCase().includes(filter) ||
                slug.toLowerCase().includes(filter) ||
                description.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const sortMenus = useCallback(
        users => {
            if (!sort) {
                return users;
            }
            const [[key, value]] = Object.entries(sort);
            return orderBy(users, [key], [value]);
        },
        [sort]
    );

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
            return item.createdBy.id === identity.login;
        }

        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("d");
        }

        return true;
    }, []);

    const menusDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Form
                    data={{ sort: serializeSorters(sort) }}
                    onChange={({ sort }) => {
                        // Update "sort".
                        if (typeof sort === "string") {
                            const newSort = deserializeSorters(sort);
                            // @ts-ignore
                            setSort(newSort);
                        }
                    }}
                >
                    {({ Bind }) => (
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"sort"}>
                                    <Select label={t`Sort by`} description={"Sort pages by"}>
                                        {SORTERS.map(({ label, sorters }) => {
                                            return (
                                                <option
                                                    key={label}
                                                    value={serializeSorters(sorters)}
                                                >
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </Select>
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <ButtonDefault
                                    className={resetButtonStyle}
                                    onClick={() => setSort(null)}
                                    disabled={sort === null}
                                >
                                    Reset
                                </ButtonDefault>
                            </Cell>
                        </Grid>
                    )}
                </Form>
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
                        data-testid="new-record-button"
                        onClick={() => history.push("/page-builder/menus?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`Add Menu`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI value={filter} onChange={setFilter} inputPlaceholder={t`Search menus`} />
            }
            modalOverlay={menusDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon className={classNames({ [activeIcon]: sort })} />}
                />
            }
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
