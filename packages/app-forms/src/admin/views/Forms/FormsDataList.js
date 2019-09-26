// @flow
import React, { useRef, useCallback } from "react";
import TimeAgo from "timeago-react";
import useReactRouter from "use-react-router";
import { css } from "emotion";
import { get, upperFirst } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { DELETE_FORM, CREATE_REVISION_FROM } from "@webiny/app-forms/admin/viewsGraphql";
import { useApolloClient } from "react-apollo";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListTextOverline,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormsApp.FormsDataList");

const rightAlign = css({
    alignItems: "flex-end !important"
});

const FormsDataList = props => {
    const editHandlers = useRef({});

    const { dataList } = props;
    const { location, history } = useReactRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const deleteRecord = useHandler(props, ({ id }: Object) => async (item: Object) => {
        const res = await client.mutate({ mutation: DELETE_FORM, variables: { id: item.id } });
        const { data, error } = get(res, "data.forms.deleteForm");

        if (data) {
            showSnackbar(t`Form {name} deleted.`({ name: item.name }));
        } else {
            showSnackbar(error.message, {
                title: t`Something unexpected happened.`
            });
        }

        if (item.id === id) {
            const query = new URLSearchParams(location.search);
            query.delete("id");
            history.push({ search: query.toString() });
        }

        dataList.refresh();
    });

    const editRecord = useCallback(form => {
        if (!editHandlers.current[form.id]) {
            editHandlers.current[form.id] = async () => {
                if (form.published) {
                    const { data: res } = await client.mutate({
                        mutation: CREATE_REVISION_FROM,
                        variables: { revision: form.id },
                        refetchQueries: ["FormsListForms"]
                    });
                    const { data, error } = res.forms.revision;

                    if (error) {
                        return showSnackbar(error.message);
                    }

                    history.push(`/forms/${data.id}`);
                } else {
                    history.push("/forms/" + form.id);
                }
            };
        }

        return editHandlers.current[form.id];
    }, []);

    const query = new URLSearchParams(location.search);

    return (
        <DataList
            {...dataList}
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
        >
            {({ data = [] }) => (
                <List>
                    {data.map(form => (
                        <ListItem key={form.id}>
                            <ListItemText
                                onClick={() => {
                                    query.set("id", form.id);
                                    history.push({ search: query.toString() });
                                }}
                            >
                                {form.name}
                                <ListTextOverline>{form.name}</ListTextOverline>
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
