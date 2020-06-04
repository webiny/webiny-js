import React, { useCallback, useRef } from "react";
import TimeAgo from "timeago-react";
import useReactRouter from "use-react-router";
import { css } from "emotion";
import get from "lodash/get";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { DELETE_CONTENT_MODEL } from "../../viewsGraphql";
import { useApolloClient } from "@webiny/app-headless-cms/admin/hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import CurrentEnvironmentLabel from "./../../components/CurrentEnvironmentLabel";

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
const t = i18n.namespace("FormsApp.ContentModelsDataList");

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

export type ContentModelsDataListProps = {
    id?: any;
    dataList: any;
};

const ContentModelsDataList = (props: ContentModelsDataListProps) => {
    const { dataList } = props;

    const { location, history } = useReactRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const deleteRecord = async item => {
        const res = await client.mutate({
            mutation: DELETE_CONTENT_MODEL,
            variables: { id: item.id },
            awaitRefetchQueries: true,
            refetchQueries: [
                "HeadlessCmsListContentModels",
                "HeadlessCmsListMenuContentGroupsModels"
            ]
        });

        const { data, error } = get(res, "data.deleteContentModel");

        if (data) {
            showSnackbar(t`Content model {name} deleted.`({ name: item.name }));
        } else {
            showSnackbar(error.message, {
                title: t`Something unexpected happened.`
            });
        }

        if (item.id === props.id) {
            const query = new URLSearchParams(location.search);
            query.delete("id");
            history.push({ search: query.toString() });
        }

        dataList.refresh();
    };

    const editHandlers = useRef({});
    const editRecord = useCallback(contentModel => {
        if (!editHandlers.current[contentModel.id]) {
            editHandlers.current[contentModel.id] = async () => {
                history.push("/cms/content-models/" + contentModel.id);
            };
        }

        return editHandlers.current[contentModel.id];
    }, undefined);

    return (
        <DataList
            {...dataList}
            title={t`Content Models`}
            actions={<CurrentEnvironmentLabel style={{ justifyContent: "flex-end" }} />}
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
                    label: t`Title A-Z`,
                    sorters: { name: 1 }
                },
                {
                    label: t`Title Z-A`,
                    sorters: { name: -1 }
                }
            ]}
        >
            {({ data = [] }) => (
                <List data-testid="default-data-list">
                    {data.map(contentModel => (
                        <ListItem key={contentModel.id} className={listItemMinHeight}>
                            <ListItemText>
                                {contentModel.name}
                                {contentModel.createdBy && (
                                    <ListItemTextSecondary>
                                        {contentModel.createdBy.firstName && (
                                            <>
                                                {t`Created by: {user}.`({
                                                    user: contentModel.createdBy.firstName
                                                })}{" "}
                                            </>
                                        )}

                                        {t`Last modified: {time}.`({
                                            time: <TimeAgo datetime={contentModel.savedOn} />
                                        })}
                                    </ListItemTextSecondary>
                                )}
                            </ListItemText>
                            <ListItemMeta className={rightAlign}>
                                <ListActions>
                                    <EditIcon onClick={editRecord(contentModel)} />
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() =>
                                                    showConfirmation(async () =>
                                                        deleteRecord(contentModel)
                                                    )
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

export default ContentModelsDataList;
