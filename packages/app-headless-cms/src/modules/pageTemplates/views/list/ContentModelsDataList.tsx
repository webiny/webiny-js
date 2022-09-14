import React, { useCallback, useMemo, useState } from "react";
// @ts-ignore Package `timeago-react` doesn't have types.
import TimeAgo from "timeago-react";
import { css } from "emotion";
import get from "lodash/get";
import orderBy from "lodash/orderBy";
import { useRouter } from "@webiny/react-router";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import * as UIL from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary, IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/round/add.svg";
import { ReactComponent as ViewListIcon } from "@material-design-icons/svg/round/view_list.svg";
import { ReactComponent as CloneIcon } from "@material-design-icons/svg/round/library_add.svg";
import { ReactComponent as FilterIcon } from "@material-design-icons/svg/round/filter_alt.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { removeModelFromGroupCache, removeModelFromListCache, removeModelFromCache } from "./cache";
import * as GQL from "~/admin/viewsGraphql";
import { useApolloClient, useQuery } from "~/admin/hooks";
import { deserializeSorters } from "~/admin/views/utils";
import { CmsEditorContentModel, CmsModel } from "~/types";
import {
    DeleteCmsModelMutationResponse,
    DeleteCmsModelMutationVariables,
    ListCmsModelsQueryResponse
} from "~/admin/viewsGraphql";
import { usePermission } from "~/admin/hooks";

const t = i18n.namespace("app-headless-cms/page-templates/data-list");

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

const isPageTemplate = (model: CmsModel) => {
    return model.tags.some(tag => tag === "type:pageTemplate");
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
    const { data, loading } = useQuery<ListCmsModelsQueryResponse>(GQL.LIST_CONTENT_MODELS);
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

    const models: CmsModel[] = loading
        ? []
        : get(data, "listContentModels.data", []).filter(isPageTemplate);

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
        history.push("/cms/page-templates/" + contentModel.modelId);
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
                            description={"Sort page templates by"}
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

    return (
        <UIL.DataList
            loading={loading}
            data={contentModels}
            title={t`Page Templates`}
            actions={
                canCreate ? (
                    <ButtonSecondary data-testid="new-record-button" onClick={onCreate}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Page Template`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search page templates`}
                />
            }
            modalOverlay={contentModelsDataListModalOverlay}
            modalOverlayAction={
                <UIL.DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
        >
            {({ data = [] }: { data: CmsModel[] }) => (
                <UIL.List data-testid="default-data-list">
                    {data.map(contentModel => {
                        const disableViewContent = contentModel.fields.length === 0;
                        const message = disableViewContent
                            ? "To view the content, you first need to add a field and save the model."
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
                                                {contentModel.plugin ? (
                                                    <Tooltip
                                                        content={t`Page template is registered via a plugin.`}
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
                                                        content={t`Edit page template`}
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

                                        <Tooltip content={"Clone page template"} placement={"top"}>
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
                                                content={t`Page template is registered via a plugin.`}
                                                placement={"top"}
                                            >
                                                <DeleteIcon
                                                    disabled
                                                    data-testid={"cms-delete-content-model-button"}
                                                />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip
                                                content={t`Delete page template`}
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
