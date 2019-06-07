// @flow
import * as React from "react";
import TimeAgo from "timeago-react";
import { withRouter } from "react-router-dom";
import { i18n } from "webiny-app/i18n";
import { css } from "emotion";
import { Typography } from "webiny-ui/Typography";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { DeleteIcon, EditIcon } from "webiny-ui/List/DataList/icons";

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

const t = i18n.namespace("FormsDataList");

const rightAlign = css({
    alignItems: "flex-end !important"
});

const FormsDataList = props => {
    const { dataList, location, history } = props;
    const query = new URLSearchParams(location.search);

    return (
        <DataList
            {...dataList}
            title={t`Forms`}
            sorters={[
                {
                    label: "Newest to oldest",
                    sorters: { createdOn: -1 }
                },
                {
                    label: "Oldest to newest",
                    sorters: { createdOn: 1 }
                },
                {
                    label: "Name A-Z",
                    sorters: { name: 1 }
                },
                {
                    label: "Name Z-A",
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
                                    <EditIcon onClick={() => history.push("/forms/" + form.id)} />
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() =>
                                                    showConfirmation(() => deleteRecord(item))
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

export default withRouter(FormsDataList);
