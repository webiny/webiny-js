import React, { useCallback, useMemo, useState } from "react";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { ReactComponent as ViewListIcon } from "../../icons/view_list.svg";
import { ReactComponent as CloneIcon } from "../../icons/clone.svg";
import { useApolloClient, useModels } from "../../hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import * as UIL from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary, IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { removeModelFromCache, removeModelFromGroupCache, removeModelFromListCache } from "./cache";
import * as GQL from "../../viewsGraphql";
import {
    DeleteCmsModelMutationResponse,
    DeleteCmsModelMutationVariables
} from "../../viewsGraphql";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { deserializeSorters } from "../utils";
import orderBy from "lodash/orderBy";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { CmsEditorContentModel, CmsModel } from "~/types";
import usePermission from "~/admin/hooks/usePermission";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

const t = i18n.namespace("FormsApp.ContentModelsDataList");

interface Sorter {
    label: string;
    sorters: string;
}

const SORTERS: Sorter[] = [
    {
        label: t`Newest to oldest`,
        sorters: "savedOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        sorters: "savedOn_ASC"
    },
    {
        label: t`Name A-Z`,
        sorters: "name_ASC"
    },
    {
        label: t`Name Z-A`,
        sorters: "name_DESC"
    }
];

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

interface ContentModelsDataListProps {
    canCreate: boolean;
    onCreate: () => void;
    onClone: (contentModel: CmsEditorContentModel) => void;
}

const Icon = styled("div")({
    width: "24px",
    height: "24px",
    marginRight: "15px",
    flex: "0 0 24px",
    svg: {
        color: "var(--mdc-theme-text-icon-on-light)",
        width: "100%",
        height: "auto",
        maxWidth: 24,
        maxHeight: 24
    }
});

interface IconProps {
    model: Pick<CmsModel, "icon">;
}

const DisplayIcon: React.VFC<IconProps> = ({ model }) => {
    if (!model.icon) {
        return null;
    }
    return <FontAwesomeIcon icon={(model.icon || "").split("/") as IconProp} />;
};

const ContentModelsDataList: React.FC<ContentModelsDataListProps> = ({
    canCreate,
    onCreate,
    onClone
}) => {
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(SORTERS[0].sorters);
    const { history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "cms-delete-content-model-dialog"
    });
    const { models, loading, refresh } = useModels();
    const { canDelete, canEdit } = usePermission();

    const filterData = useCallback(
        ({ name }: Pick<CmsModel, "name">): boolean => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortData = useCallback(
        (list: CmsModel[]): CmsModel[] => {
            if (!sort) {
                return list;
            }
            const [sortField, sortOrderBy] = deserializeSorters(sort);
            return orderBy(list, [sortField], [sortOrderBy]);
        },
        [sort]
    );

    const deleteRecord = async (item: CmsModel): Promise<void> => {
        showConfirmation(async () => {
            await client.mutate<DeleteCmsModelMutationResponse, DeleteCmsModelMutationVariables>({
                mutation: GQL.DELETE_CONTENT_MODEL,
                variables: { modelId: item.modelId },
                update(cache, { data }) {
                    if (!data) {
                        showSnackbar("Missing data on Delete Content Model Mutation Response.");
                        return;
                    }
                    const { error } = data.deleteContentModel;

                    if (error) {
                        showSnackbar(error.message, {
                            title: t`Something unexpected happened.`
                        });
                        return;
                    }

                    removeModelFromListCache(cache, item);
                    removeModelFromGroupCache(cache, item);
                    removeModelFromCache(client, item);

                    showSnackbar(
                        t`Content model {name} deleted successfully!.`({ name: item.name })
                    );
                }
            });
        });
    };

    const editRecord = (contentModel: CmsModel): void => {
        history.push("/cms/content-models/" + contentModel.modelId);
    };

    const viewContentEntries = useCallback(contentModel => {
        return () => history.push("/cms/content-entries/" + contentModel.modelId);
    }, []);

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
                                    <option key={label} value={sorters}>
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

    const onRefreshClick = useCallback(() => {
        refresh();
    }, []);

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
            modalOverlayAction={
                <UIL.DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
            refresh={onRefreshClick}
        >
            {({ data = [] }: { data: CmsModel[] }) => (
                <UIL.List data-testid="default-data-list">
                    {data.map(contentModel => {
                        const disableViewContent = contentModel.fields.length === 0;
                        const message = disableViewContent
                            ? "To view the content, you first need to add a field and save the model"
                            : "View content";
                        return (
                            <UIL.ListItem key={contentModel.modelId} className={listItemMinHeight}>
                                <Icon>
                                    <DisplayIcon model={contentModel} />
                                </Icon>
                                <UIL.ListItemText>
                                    {contentModel.name}
                                    <UIL.ListItemTextSecondary>
                                        {t`Last modified: {time}.`({
                                            time: contentModel.savedOn ? (
                                                <TimeAgo datetime={contentModel.savedOn} />
                                            ) : (
                                                "N/A"
                                            )
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
                                                {contentModel.plugin ? (
                                                    <Tooltip
                                                        content={t`Content model is registered via a plugin.`}
                                                        placement={"top"}
                                                    >
                                                        <EditIcon
                                                            disabled
                                                            data-testid={
                                                                "cms-edit-content-model-button"
                                                            }
                                                        />
                                                    </Tooltip>
                                                ) : (
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
                                                )}
                                            </>
                                        )}

                                        <Tooltip content={"Clone content model"} placement={"top"}>
                                            <IconButton
                                                data-testid={"cms-clone-content-model-button"}
                                                icon={<CloneIcon />}
                                                label={t`View entries`}
                                                onClick={() => onClone(contentModel)}
                                            />
                                        </Tooltip>

                                        {canDelete(contentModel, "cms.contentModel") &&
                                        contentModel.plugin ? (
                                            <Tooltip
                                                content={t`Content model is registered via a plugin.`}
                                                placement={"top"}
                                            >
                                                <DeleteIcon
                                                    disabled
                                                    data-testid={"cms-delete-content-model-button"}
                                                />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip
                                                content={t`Delete content model`}
                                                placement={"top"}
                                            >
                                                <DeleteIcon
                                                    onClick={() => deleteRecord(contentModel)}
                                                    data-testid={"cms-delete-content-model-button"}
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
