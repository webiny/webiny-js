import React, { useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "react-apollo";
import debounce from "lodash/debounce";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import { LIST_PAGES } from "@webiny/app-page-builder/admin/graphql/pages";
import TimeAgo from "timeago-react";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListTextOverline,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";
import { Form } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { LIST_CATEGORIES } from "./../Categories/graphql";
import { Grid, Cell } from "@webiny/ui/Grid";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import statusesLabels from "@webiny/app-page-builder/admin/constants/pageStatusesLabels";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { SimpleModal } from "@webiny/app-admin/components/SimpleModal";
import { FilterIcon } from "@webiny/ui/List/DataList/icons";
import { serializeSorters, deserializeSorters } from "../utils";

const t = i18n.ns("app-page-builder/admin/pages/data-list");
const rightAlign = css({
    alignItems: "flex-end !important"
});
const activeIcon = css({
    "& svg": {
        color: "var(--mdc-theme-primary)"
    }
});
const sorters = [
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

type PagesDataListProps = {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
};
const PagesDataList = ({ onCreatePage, canCreate }: PagesDataListProps) => {
    const [filter, setFilter] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { history, location } = useRouter();
    const query = new URLSearchParams(location.search);

    const [where, setWhere] = useState({});
    const [sort, setSort] = useState({ createdOn: "desc" });
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const search = {
        query: query.get("search") || undefined
    };

    const setSearchParams = useMemo(() => {
        return debounce(({ filter, location }) => {
            const params = new URLSearchParams(location.search);
            if (filter) {
                params.set("search", filter);
            } else {
                params.delete("search");
            }
            // Update search in URL.
            history.push(`${location.pathname}?${params.toString()}`);
        }, 250);
    }, []);
    // Update "search" param whenever filter is changed
    useEffect(() => {
        setSearchParams({
            filter,
            location
        });
    }, [filter]);

    const variables = {
        where,
        sort,
        limit,
        page,
        search
    };

    const listQuery = useQuery(LIST_PAGES, {
        fetchPolicy: "network-only",
        variables
    });

    // Needs to be refactored. Possibly, with our own GQL client, this is going to be much easier to handle.
    localStorage.setItem("wby_pb_pages_list_latest_variables", JSON.stringify(variables));

    const data = get(listQuery, "data.pageBuilder.listPages.data", []);
    const meta = get(listQuery, "data.pageBuilder.listPages.meta", {});
    const selectedPageId = new URLSearchParams(location.search).get("id");

    const categoriesQuery = useQuery(LIST_CATEGORIES);
    const categoriesData = get(categoriesQuery, "data.pageBuilder.listCategories.data", []);

    const loading = [listQuery].find(item => item.loading);

    const renderModal = useMemo(
        () => (
            <SimpleModal isOpen={isModalOpen} onDismiss={() => setIsModalOpen(false)}>
                <Form
                    data={{ ...where, sort: serializeSorters(sort) }}
                    onChange={({ status, category, sort }) => {
                        // Update "where" filter.
                        const where = { category, status: undefined };
                        if (status !== "all") {
                            where.status = status;
                        }

                        setWhere(where);

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
                                <Bind name={"category"}>
                                    <AutoComplete
                                        description={"Filter by a specific category."}
                                        label={t`Filter by category`}
                                        options={categoriesData.map(item => ({
                                            id: item.slug,
                                            name: item.name
                                        }))}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name={"status"}>
                                    <Select
                                        label={t`Filter by status`}
                                        description={"Filter by a specific page status."}
                                    >
                                        <option value={"all"}>{t`All`}</option>
                                        <option value={"draft"}>{t`Draft`}</option>
                                        <option value={"published"}>{t`Published`}</option>
                                        <option value={"unpublished"}>{t`Unpublished`}</option>
                                        <option
                                            value={"reviewRequested"}
                                        >{t`Review requested`}</option>
                                        <option
                                            value={"changesRequested"}
                                        >{t`Changes requested`}</option>
                                    </Select>
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name={"sort"}>
                                    <Select label={t`Sort by`} description={"Sort pages by"}>
                                        {sorters.map(({ label, sorters }) => {
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

    return (
        <DataList
            title={t`Pages`}
            loading={Boolean(loading)}
            actions={
                canCreate ? (
                    <ButtonSecondary data-testid="new-record-button" onClick={onCreatePage}>
                        <ButtonIcon icon={<AddIcon />} /> {t`Create Page`}
                    </ButtonSecondary>
                ) : null
            }
            data={data}
            pagination={{
                perPageOptions: [10, 25, 50],
                setPerPage: setLimit,
                hasNextPage: meta.nextPage,
                hasPreviousPage: meta.previousPage,
                setNextPage: () => setPage(page + 1),
                setPreviousPage: () => setPage(page - 1)
            }}
            search={
                <SearchUI value={filter} onChange={setFilter} inputPlaceholder={t`Search pages`} />
            }
            modal={renderModal}
            modalAction={
                <FilterIcon
                    className={classNames({ [activeIcon]: !isEmpty(sort) })}
                    onClick={() => setIsModalOpen(!isModalOpen)}
                />
            }
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(page => (
                        <ListItem key={page.id} selected={page.id === selectedPageId}>
                            <ListItemText
                                onClick={() => {
                                    query.set("id", page.id);
                                    history.push({ search: query.toString() });
                                }}
                            >
                                {page.title}
                                <ListTextOverline>
                                    {page.category?.name || t`Unknown category`}
                                </ListTextOverline>
                                {page.createdBy && (
                                    <ListItemTextSecondary>
                                        Created by: {page.createdBy.firstName || "N/A"}. Last
                                        modified: <TimeAgo datetime={page.savedOn} />.
                                    </ListItemTextSecondary>
                                )}
                            </ListItemText>
                            <ListItemMeta className={rightAlign}>
                                <Typography use={"subtitle2"}>
                                    {statusesLabels[page.status]} (v{page.version})
                                </Typography>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default PagesDataList;
