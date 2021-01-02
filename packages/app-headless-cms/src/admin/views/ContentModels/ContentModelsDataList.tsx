import React, { useCallback } from "react";
import TimeAgo from "timeago-react";
import { css } from "emotion";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { ReactComponent as ViewListIcon } from "@webiny/app-headless-cms/admin/icons/view_list.svg";
import { useApolloClient, useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import * as UIL from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { removeModelFromGroupCache, removeModelFromListCache } from "./cache";
import * as GQL from "../../viewsGraphql";

const t = i18n.namespace("FormsApp.ContentModelsDataList");

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

const viewEntriesIconStyles = css({
    color: "var(--mdc-theme-text-secondary-on-background)"
});

const ContentModelsDataList = () => {
    const { history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();
    const { data, loading, refetch } = useQuery(GQL.LIST_CONTENT_MODELS);

    const models = loading ? [] : get(data, "listContentModels.data", []);

    const deleteRecord = async item => {
        showConfirmation(async () => {
            await client.mutate({
                mutation: GQL.DELETE_CONTENT_MODEL,
                variables: { modelId: item.modelId },
                update(cache, { data }) {
                    const { error } = data.deleteContentModel;

                    if (error) {
                        return showSnackbar(error.message, {
                            title: t`Something unexpected happened.`
                        });
                    }

                    removeModelFromListCache(cache, item);
                    removeModelFromGroupCache(cache, item);

                    showSnackbar(
                        t`Content model {name} deleted successfully!.`({ name: item.name })
                    );
                }
            });
        });
    };

    const editRecord = contentModel => {
        history.push("/cms/content-models/" + contentModel.modelId);
    };

    const viewContentEntries = useCallback(contentModel => {
        return () => history.push("/cms/content-entries/" + contentModel.modelId);
    }, undefined);

    return (
        <UIL.DataList loading={loading} data={models} title={t`Content Models`} refresh={refetch}>
            {({ data = [] }) => (
                <UIL.List data-testid="default-data-list">
                    {data.map(contentModel => (
                        <UIL.ListItem key={contentModel.modelId} className={listItemMinHeight}>
                            <UIL.ListItemText>
                                {contentModel.name}
                                <UIL.ListItemTextSecondary>
                                    {t`Last modified: {time}.`({
                                        time: <TimeAgo datetime={contentModel.savedOn} />
                                    })}
                                </UIL.ListItemTextSecondary>
                            </UIL.ListItemText>
                            <UIL.ListItemMeta className={rightAlign}>
                                <UIL.ListActions>
                                    <Tooltip content={t`View content`} placement={"top"}>
                                        <IconButton
                                            data-testid={"cms-view-content-model-button"}
                                            icon={
                                                <ViewListIcon className={viewEntriesIconStyles} />
                                            }
                                            label={t`View entries`}
                                            onClick={viewContentEntries(contentModel)}
                                        />
                                    </Tooltip>
                                    <Tooltip content={t`Edit content model`} placement={"top"}>
                                        <EditIcon
                                            onClick={() => editRecord(contentModel)}
                                            data-testid={"cms-edit-content-model-button"}
                                        />
                                    </Tooltip>
                                    <Tooltip content={t`Delete content model`} placement={"top"}>
                                        <DeleteIcon onClick={() => deleteRecord(contentModel)} />
                                    </Tooltip>
                                </UIL.ListActions>
                            </UIL.ListItemMeta>
                        </UIL.ListItem>
                    ))}
                </UIL.List>
            )}
        </UIL.DataList>
    );
};

export default ContentModelsDataList;
