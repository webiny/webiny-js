import React, { useState } from "react";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "react-apollo";
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
import { MenuItem } from "@webiny/ui/Menu";
import { Form } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { LIST_CATEGORIES } from "./../Categories/graphql";
import { Grid, Cell } from "@webiny/ui/Grid";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import statusesLabels from "@webiny/app-page-builder/admin/constants/pageStatusesLabels";

const t = i18n.ns("app-page-builder/admin/pages/data-list");
const rightAlign = css({
    alignItems: "flex-end !important"
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

const PageBuilderPagesDataList = () => {
    const { history, location } = useRouter();

    const [where, setWhere] = useState({});
    const [sort, setSort] = useState();
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);

    const listQuery = useQuery(LIST_PAGES, {
        fetchPolicy: "no-cache",
        variables: { where, sort, limit, page }
    });

    const data = listQuery?.data?.pageBuilder?.listPages?.data || [];
    const meta = listQuery?.data?.pageBuilder?.listPages?.meta || {};
    const selectedPageId = new URLSearchParams(location.search).get("id");

    const categoriesQuery = useQuery(LIST_CATEGORIES);
    const categoriesData = categoriesQuery?.data?.pageBuilder.listCategories.data || [];

    const loading = [listQuery].find(item => item.loading);
    const query = new URLSearchParams(location.search);

    return (
        <DataList
            loading={Boolean(loading)}
            data={data}
            pagination={{
                perPageOptions: [10, 25, 50],
                setPerPage: setLimit,
                hasNextPage: meta.nextPage,
                hasPreviousPage: meta.previousPage,
                setNextPage: () => setPage(page + 1),
                setPreviousPage: () => setPage(page - 1)
            }}
            title={t`Pages`}
            refresh={listQuery.refetch}
            sorters={sorters}
            setSorters={setSort}
            filters={
                <MenuItem>
                    <Form
                        data={{ status: "all" }}
                        onChange={({ status, category }) => {
                            const where = { category, status: undefined };
                            if (status !== "all") {
                                where.status = status;
                            }

                            setWhere(where);
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
                            </Grid>
                        )}
                    </Form>
                </MenuItem>
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

export default PageBuilderPagesDataList;
