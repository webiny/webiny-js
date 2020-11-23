import React, { useRef, useCallback } from "react";
import TimeAgo from "timeago-react";
import { useRouter } from "@webiny/react-router";
import { css } from "emotion";
import { upperFirst } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { DELETE_FORM, CREATE_REVISION_FROM } from "@webiny/app-form-builder/admin/viewsGraphql";
import { useApolloClient } from "react-apollo";
import { useHandler } from "@webiny/app/hooks/useHandler";
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

const FormsDataList = (props: FormsDataListProps) => {
    const editHandlers = useRef({});

    const { listQuery } = props;

    const { location, history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const deleteRecord = useHandler(props, ({ id }) => async item => {
        const res = await client.mutate({ mutation: DELETE_FORM, variables: { id: item.id } });
        const { data, error } = res?.data?.formBuilder?.deleteForm || {};

        if (data) {
            showSnackbar(t`Form {name} deleted.`({ name: item.name }));
        } else {
            showSnackbar(error?.message, {
                title: t`Something unexpected happened.`
            });
        }

        if (item.id === id) {
            const query = new URLSearchParams(location.search);
            query.delete("id");
            history.push({ search: query.toString() });
        }

        listQuery.refetch();
    });

    const editRecord = useCallback(form => {
        // Note: form id is remains the same after publish.
        const handlerKey = form.id + form.status;
        if (!editHandlers.current[handlerKey]) {
            editHandlers.current[handlerKey] = async () => {
                if (form.published) {
                    const { data: res } = await client.mutate({
                        mutation: CREATE_REVISION_FROM,
                        variables: { revision: form.id },
                        refetchQueries: ["FormsListForms"]
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

    const listFormsData = listQuery?.data?.formBuilder?.listForms?.data || [];

    return (
        <DataList
            data={listFormsData}
            loading={listQuery.loading}
            refresh={listQuery.refetch}
            title={t`Forms`}
            sorters={[
                {
                    label: t`Newest to oldest`,
                    sorters: { createdOn: -1 }
                },
                {
                    label: t`Oldest to newest`,
                    sorters: { createdOn: 1 }
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
            setSorters={sort => listQuery.refetch({ sort })}
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
                                    <ConfirmationDialog>
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
