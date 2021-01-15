import React, { useCallback, useMemo, useState } from "react";
import { css } from "emotion";
import classNames from "classnames";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "react-apollo";
import { LIST_CATEGORIES, DELETE_CATEGORY } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import orderBy from "lodash/orderBy";

import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary
} from "@webiny/ui/List";

import { DeleteIcon, FilterIcon } from "@webiny/ui/List/DataList/icons";
import { Form } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { useSecurity } from "@webiny/app-security";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { SimpleModal } from "@webiny/app-admin/components/SimpleModal";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { serializeSorters, deserializeSorters } from "../utils";

const t = i18n.ns("app-page-builder/admin/categories/data-list");
const activeIcon = css({
    "& svg": {
        color: "var(--mdc-theme-primary)"
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
        label: t`Name A-Z`,
        sorters: { name: "asc" }
    },
    {
        label: t`Name Z-A`,
        sorters: { name: "desc" }
    }
];

type PageBuilderCategoriesDataListProps = {
    canCreate: boolean;
};
const PageBuilderCategoriesDataList = ({ canCreate }: PageBuilderCategoriesDataListProps) => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_CATEGORIES);
    const [deleteIt, deleteMutation] = useMutation(DELETE_CATEGORY, {
        refetchQueries: [{ query: LIST_CATEGORIES }]
    });

    const filterData = useCallback(
        ({ slug, name, url }) => {
            return (
                slug.toLowerCase().includes(filter) ||
                name.toLowerCase().includes(filter) ||
                url.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const sortData = useCallback(
        users => {
            if (!sort) {
                return users;
            }
            const [[key, value]] = Object.entries(sort);
            return orderBy(users, [key], [value]);
        },
        [sort]
    );

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
        if (pbMenuPermission.own) {
            return item.createdBy.id === identity.login;
        }

        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("d");
        }

        return true;
    }, []);

    const loading = [listQuery, deleteMutation].find(item => item.loading);

    const renderModal = useMemo(
        () => (
            <SimpleModal isOpen={isModalOpen} onDismiss={() => setIsModalOpen(false)}>
                <Form
                    data={{ sort: serializeSorters(sort) }}
                    onChange={({ sort }) => {
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
                        </Grid>
                    )}
                </Form>
            </SimpleModal>
        ),
        [isModalOpen]
    );

    const filteredData = filter === "" ? data : data.filter(filterData);
    const categoryList = sortData(filteredData);

    return (
        <DataList
            title={t`Categories`}
            loading={Boolean(loading)}
            data={categoryList}
            actions={
                canCreate ? (
                    <ButtonSecondary
                        data-testid="new-record-button"
                        onClick={() => history.push("/page-builder/categories?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`Add Category`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search categories`}
                />
            }
            modal={renderModal}
            modalAction={
                <FilterIcon
                    className={classNames({ [activeIcon]: sort })}
                    onClick={() => setIsModalOpen(!isModalOpen)}
                />
            }
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
