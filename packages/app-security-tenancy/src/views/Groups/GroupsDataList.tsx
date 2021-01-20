import React, { useCallback, useState } from "react";
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
import { Tooltip } from "@webiny/ui/Tooltip";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as AddIcon } from "../../assets/icons/add-18px.svg";
import orderBy from "lodash/orderBy";

const t = i18n.ns("app-security/admin/groups/data-list");

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

const GroupsDataList = () => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(null);
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();

    const { data: listResponse, loading: listLoading, refetch } = useQuery(LIST_GROUPS);

    const [deleteIt, { loading: deleteLoading }] = useMutation(DELETE_GROUP, {
        refetchQueries: [{ query: LIST_GROUPS }]
    });

    const data = listLoading && !listResponse ? [] : listResponse.security.groups.data;
    const slug = new URLSearchParams(location.search).get("slug");

    const filterGroup = useCallback(
        ({ name, slug, description }) => {
            return (
                name.toLowerCase().includes(filter) ||
                slug.toLowerCase().includes(filter) ||
                description.toLowerCase().includes(filter)
            );
        },
        [filter]
    );

    const sortGroups = useCallback(
        groups => {
            if (!sort) {
                return groups;
            }
            const [[key, value]] = Object.entries(sort);
            return orderBy(groups, [key], [value]);
        },
        [sort]
    );

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

    const filteredData = filter === "" ? data : data.filter(filterGroup);
    const groupList = sortGroups(filteredData);

    return (
        <DataList
            title={t`Security Groups`}
            actions={
                <ButtonSecondary
                    data-testid="new-record-button"
                    onClick={() => history.push("/security/groups?new=true")}
                >
                    <ButtonIcon icon={<AddIcon />} /> {t`New Group`}
                </ButtonSecondary>
            }
            data={groupList}
            refresh={refetch}
            loading={listLoading || deleteLoading}
            search={
                <SearchUI value={filter} onChange={setFilter} inputPlaceholder={t`Search Groups`} />
            }
            sorters={SORTERS}
            setSorters={sorter => setSort(sorter)}
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
                                    {item.slug !== "full-access" ? (
                                        <DeleteIcon onClick={() => deleteItem(item)} />
                                    ) : (
                                        <Tooltip
                                            placement={"bottom"}
                                            content={<span>{t`You can't delete this group.`}</span>}
                                        >
                                            <DeleteIcon disabled />
                                        </Tooltip>
                                    )}
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
