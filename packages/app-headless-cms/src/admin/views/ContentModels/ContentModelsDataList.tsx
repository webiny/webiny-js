import React, { useCallback, useMemo, useState } from "react";
import TimeAgo from "timeago-react";
import { css } from "emotion";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { ReactComponent as ViewListIcon } from "../../icons/view_list.svg";
import { useApolloClient, useQuery } from "../../hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import * as UIL from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary, IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { removeModelFromGroupCache, removeModelFromListCache } from "./cache";
import * as GQL from "../../viewsGraphql";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { deserializeSorters, serializeSorters } from "../utils";
import orderBy from "lodash/orderBy";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import usePermission from "../../hooks/usePermission";

const t = i18n.namespace("FormsApp.ContentModelsDataList");

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

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

type ContentModelsDataListProps = {
    canCreate: boolean;
    onCreate: () => void;
};
const ContentModelsDataList = ({ canCreate, onCreate }: ContentModelsDataListProps) => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(serializeSorters(SORTERS[0].sorters));
    const { history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();
    const { data, loading } = useQuery(GQL.LIST_CONTENT_MODELS);
    const { canDelete, canEdit } = usePermission();

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

    const contentModelsDataListModalOverlay = useMemo(
        () => (
            <UIL.DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={"Sort content models by"}
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
            </UIL.DataListModalOverlay>
        ),
        [sort]
    );

    const filteredData = filter === "" ? models : models.filter(filterData);
    const contentModels = sortData(filteredData);

    return (
        <UIL.DataList
            loading={loading}
            data={contentModels}
            title={t`Content Models`}
            actions={
                canCreate ? (
                    <ButtonSecondary data-testid="new-record-button" onClick={onCreate}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Model`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search content models`}
                />
            }
            modalOverlay={contentModelsDataListModalOverlay}
            modalOverlayAction={<UIL.DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data = [] }) => (
                <UIL.List data-testid="default-data-list">
                    {data.map(contentModel => {
                        const disableViewContent = contentModel.fields.length === 0;
                        const message = disableViewContent
                            ? "To view the content, you first need to add a field and save the model"
                            : "View content";
                        return (
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
                                        {canEdit(contentModel, "cms.contentModel") && (
                                            <>
                                                <Tooltip
                                                    content={t`{message}`({ message })}
                                                    placement={"top"}
                                                >
                                                    <IconButton
                                                        data-testid={
                                                            "cms-view-content-model-button"
                                                        }
                                                        icon={<ViewListIcon />}
                                                        label={t`View entries`}
                                                        onClick={viewContentEntries(contentModel)}
                                                        disabled={disableViewContent}
                                                    />
                                                </Tooltip>
                                                <Tooltip
                                                    content={t`Edit content model`}
                                                    placement={"top"}
                                                >
                                                    <EditIcon
                                                        onClick={() => editRecord(contentModel)}
                                                        data-testid={
                                                            "cms-edit-content-model-button"
                                                        }
                                                    />
                                                </Tooltip>
                                            </>
                                        )}
                                        {canDelete(contentModel, "cms.contentModel") && (
                                            <Tooltip
                                                content={t`Delete content model`}
                                                placement={"top"}
                                            >
                                                <DeleteIcon
                                                    onClick={() => deleteRecord(contentModel)}
                                                />
                                            </Tooltip>
                                        )}
                                    </UIL.ListActions>
                                </UIL.ListItemMeta>
                            </UIL.ListItem>
                        );
                    })}
                </UIL.List>
            )}
        </UIL.DataList>
    );
};

export default ContentModelsDataList;
