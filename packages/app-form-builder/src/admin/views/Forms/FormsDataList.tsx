import React, { useRef, useCallback, useReducer } from "react";
import TimeAgo from "timeago-react";
import { css } from "emotion";
import { upperFirst } from "lodash";
import { useRouter } from "@webiny/react-router";
import { Typography } from "@webiny/ui/Typography";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { DELETE_FORM, CREATE_REVISION_FROM } from "@webiny/app-form-builder/admin/graphql";
import { useApolloClient } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";
import { i18n } from "@webiny/app/i18n";
import { removeFormFromListCache, updateLatestRevisionInListCache } from "../cache";

const t = i18n.namespace("FormsApp.FormsDataList");

const rightAlign = css({
    alignItems: "flex-end !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

export type FormsDataListProps = {
    listQuery: any;
};

const compareString = (a, b, dir) => {
    a = a.toLowerCase();
    b = b.toLowerCase();

    if (a < b) {
        return -1 * dir;
    }
    if (a > b) {
        return 1 * dir;
    }

    return 0;
};

const compareDate = (a, b, dir) => {
    const date1 = new Date(a).getTime();
    const date2 = new Date(b).getTime();

    return (date1 - date2) * dir;
};

const FormsDataList = (props: FormsDataListProps) => {
    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        sort: { savedOn: -1 }
    });
    const editHandlers = useRef({});

    const { listQuery } = props;

    const { location, history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const deleteRecord = useCallback(
        async item => {
            const res = await client.mutate({
                mutation: DELETE_FORM,
                variables: { id: item.id },
                update(cache) {
                    removeFormFromListCache(cache, item);

                    const query = new URLSearchParams(location.search);
                    if (item.id === query.get("id")) {
                        return history.push("/forms");
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

                    history.push(`/forms/${encodeURIComponent(data.id)}`);
                } else {
                    history.push(`/forms/${encodeURIComponent(form.id)}`);
                }
            };
        }

        return editHandlers.current[handlerKey];
    }, []);

    const query = new URLSearchParams(location.search);

    const listFormsData = listQuery.loading ? [] : listQuery.data.formBuilder.listForms.data;

    const forms = listFormsData.sort((a, b) => {
        if (state.sort.name) {
            return compareString(a.name, b.name, state.sort.name);
        }

        if (state.sort.savedOn) {
            return compareDate(a.savedOn, b.savedOn, state.sort.savedOn);
        }

        return 0;
    });

    return (
        <DataList
            data={forms}
            loading={listQuery.loading}
            refresh={listQuery.refetch}
            title={t`Forms`}
            sorters={[
                {
                    label: t`Newest to oldest`,
                    sorters: { savedOn: -1 }
                },
                {
                    label: t`Oldest to newest`,
                    sorters: { savedOn: 1 }
                },
                {
                    label: t`Name A-Z`,
                    sorters: { name: 1 }
                },
                {
                    label: t`Name Z-A`,
                    sorters: { name: -1 }
                }
            ]}
            setSorters={sort => setState({ sort })}
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
                                    <EditIcon onClick={editRecord(form)} />
                                    <ConfirmationDialog
                                        title={"Confirmation required!"}
                                        message={
                                            "This will delete the form and all of its revisions. Are you sure you want to continue?"
                                        }
                                    >
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() =>
                                                    showConfirmation(async () => deleteRecord(form))
                                                }
                                            />
                                        )}
                                    </ConfirmationDialog>
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
