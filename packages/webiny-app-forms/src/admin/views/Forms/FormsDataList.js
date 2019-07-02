// @flow
import * as React from "react";
import TimeAgo from "timeago-react";
import { withRouter } from "react-router-dom";
import { css } from "emotion";
import { Typography } from "webiny-ui/Typography";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { DeleteIcon, EditIcon } from "webiny-ui/List/DataList/icons";
import { deleteForm, createRevisionFrom } from "webiny-app-forms/admin/viewsGraphql";
import { graphql } from "react-apollo";
import { withHandlers, compose } from "recompose";
import { withSnackbar } from "webiny-admin/components";
import { get } from "lodash";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListTextOverline,
    ListItemMeta,
    ListActions
} from "webiny-ui/List";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.FormsDataList");

const rightAlign = css({
    alignItems: "flex-end !important"
});

const FormsDataList = props => {
    const { dataList, location, history, deleteRecord, gqlCreate, showSnackbar } = props;
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
                                        {t`Created by: {user}.`({ user: form.createdBy.firstName })}{" "}
                                        {t`Last modified: {time}.`({
                                            time: <TimeAgo datetime={form.savedOn} />
                                        })}
                                    </ListItemTextSecondary>
                                )}
                            </ListItemText>
                            <ListItemMeta className={rightAlign}>
                                <Typography use={"subtitle2"}>
                                    {form.published ? t`Published` : t`Draft`} (v{form.version})
                                </Typography>
                                <ListActions>
                                    <EditIcon
                                        onClick={async () => {
                                            if (form.published) {
                                                const { data: res } = await gqlCreate({
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
                                        }}
                                    />
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() =>
                                                    showConfirmation(async () => {
                                                        deleteRecord(form);
                                                    })
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

export default compose(
    withRouter,
    withSnackbar(),
    graphql(deleteForm, { name: "deleteRecord" }),
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    withHandlers({
        deleteRecord: ({ deleteRecord, showSnackbar, location, history, dataList, id }: Object) => {
            return async (item: Object) => {
                const res = await deleteRecord({ variables: { id: item.id } });
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
            };
        }
    })
)(FormsDataList);
