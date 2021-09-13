import React, { useRef, useCallback, useState, useMemo } from "react";
import TimeAgo from "timeago-react";
import { css } from "emotion";
import orderBy from "lodash/orderBy";
import upperFirst from "lodash/upperFirst";
import { useRouter } from "@webiny/react-router";
import { Typography } from "@webiny/ui/Typography";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { DELETE_FORM, CREATE_REVISION_FROM } from "../../graphql";
import { useApolloClient } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    DataListModalOverlayAction,
    DataListModalOverlay
} from "@webiny/ui/List";
import { i18n } from "@webiny/app/i18n";
import { removeFormFromListCache, updateLatestRevisionInListCache } from "../cache";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import usePermission from "../../../hooks/usePermission";
import { useForms } from "./useForms";
import { deserializeSorters, serializeSorters } from "~/admin/views/utils";

const t = i18n.namespace("FormsApp.FormsDataList");
const rightAlign = css({
    alignItems: "flex-end !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

export type FormsDataListProps = {
    onCreateForm: () => void;
};

const SORTERS = [
    {
        label: t`Newest to oldest`,
        sorters: { savedOn: "desc" }
    },
    {
        label: t`Oldest to newest`,
        sorters: { savedOn: "asc" }
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

const FormsDataList = (props: FormsDataListProps) => {
    const editHandlers = useRef({});
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(serializeSorters({ savedOn: "desc" }));

    const { listQuery, canCreate } = useForms();

    const { location, history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { canEdit, canDelete } = usePermission();

    const deleteRecord = useCallback(
        async item => {
            const res = await client.mutate({
                mutation: DELETE_FORM,
                variables: { id: item.id },
                update(cache) {
                    removeFormFromListCache(cache, item);

                    const query = new URLSearchParams(location.search);
                    if (item.id === query.get("id")) {
                        return history.push("/form-builder/forms");
                    }
                }
            });
            const { data, error } = res.data.formBuilder.deleteForm || {};

            if (data) {
                showSnackbar(t`Form {name} deleted.`({ name: item.name }));
            } else {
                showSnackbar(error.message, {
                    title: t`Something unexpected happened.`
                });
            }
        },
        [location]
    );

    const editRecord = useCallback(form => {
        // Note: form id is remains the same after publish.
        const handlerKey = form.id + form.status;
        if (!editHandlers.current[handlerKey]) {
            editHandlers.current[handlerKey] = async () => {
                if (form.published) {
                    const { data: res } = await client.mutate({
                        mutation: CREATE_REVISION_FROM,
                        variables: { revision: form.id },
                        update(cache, { data }) {
                            updateLatestRevisionInListCache(cache, data.formBuilder.revision.data);
                        }
                    });

                    const { data, error } = res.formBuilder.revision;

                    if (error) {
                        return showSnackbar(error.message);
                    }

                    history.push(`/form-builder/forms/${encodeURIComponent(data.id)}`);
                } else {
                    history.push(`/form-builder/forms/${encodeURIComponent(form.id)}`);
                }
            };
        }

        return editHandlers.current[handlerKey];
    }, []);

    const filterData = useCallback(
        ({ name }) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortData = useCallback(
        list => {
            if (!sort) {
                return list;
            }
            const [[key, value]] = Object.entries(deserializeSorters(sort));
            return orderBy(list, [key], [value]);
        },
        [sort]
    );

    const formsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={"Sort pages by"}
                        >
                            {SORTERS.map(({ label, sorters }) => {
                                return (
                                    <option key={label} value={serializeSorters(sorters)}>
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

    const query = new URLSearchParams(location.search);

    const listFormsData = listQuery.loading ? [] : listQuery.data.formBuilder.listForms.data;

    const filteredData = filter === "" ? listFormsData : listFormsData.filter(filterData);
    const forms = sortData(filteredData);

    return (
        <DataList
            title={t`Forms`}
            data={forms}
            loading={listQuery.loading}
            actions={
                canCreate ? (
                    <ButtonSecondary data-testid="new-record-button" onClick={props.onCreateForm}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Form`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI value={filter} onChange={setFilter} inputPlaceholder={t`Search forms`} />
            }
            modalOverlay={formsDataListModalOverlay}
            modalOverlayAction={<DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data = [] }) => (
                <List data-testid="default-data-list">
                    {data.map(form => (
                        <ListItem key={form.id} className={listItemMinHeight}>
                            <ListItemText
                                onClick={() => {
                                    query.set("id", form.id);
                                    history.push({ search: query.toString() });
                                }}
                            >
                                {form.name}
                                {form.createdBy && (
                                    <ListItemTextSecondary>
                                        {form.createdBy.firstName && (
                                            <>
                                                {t`Created by: {user}.`({
                                                    user: form.createdBy.firstName
                                                })}{" "}
                                            </>
                                        )}

                                        {t`Last modified: {time}.`({
                                            time: <TimeAgo datetime={form.savedOn} />
                                        })}
                                    </ListItemTextSecondary>
                                )}
                            </ListItemText>
                            <ListItemMeta className={rightAlign}>
                                <Typography use={"subtitle2"}>
                                    {upperFirst(form.status)} (v{form.version})
                                </Typography>
                                <ListActions>
                                    {canEdit(form) && <EditIcon onClick={editRecord(form)} />}
                                    {canDelete(form) && (
                                        <ConfirmationDialog
                                            title={"Confirmation required!"}
                                            message={
                                                "This will delete the form and all of its revisions. Are you sure you want to continue?"
                                            }
                                        >
                                            {({ showConfirmation }) => (
                                                <DeleteIcon
                                                    onClick={() =>
                                                        showConfirmation(async () =>
                                                            deleteRecord(form)
                                                        )
                                                    }
                                                />
                                            )}
                                        </ConfirmationDialog>
                                    )}
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
};

export default FormsDataList;
