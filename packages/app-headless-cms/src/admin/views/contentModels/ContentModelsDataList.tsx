/**
 * TODO remove regular model delete at some point.
 */
import React, { useCallback, useMemo, useState } from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo/index.js";
import { SearchUI, useRouter } from "@webiny/app-admin";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import {
    ReactComponent as DownloadFileIcon,
    ReactComponent as ExportIcon
} from "@webiny/icons/file_download.svg";
import { ReactComponent as UploadFileIcon } from "@webiny/icons/file_upload.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/list.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as MoreVertIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as CloneIcon } from "@webiny/icons/flip_to_front.svg";
import { useModels } from "../../hooks/index.js";
import * as UIL from "@webiny/ui/List/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { deserializeSorters } from "../utils.js";
import orderBy from "lodash/orderBy.js";
import type { CmsEditorContentModel, CmsModel } from "~/types.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useModelExport } from "./exporting/useModelExport.js";
import { ModelIsBeingDeleted } from "./fullDelete/ModelIsBeingDeleted.js";
import { FullyDeleteModelDialog } from "~/admin/views/contentModels/fullDelete/FullyDeleteModelDialog.js";
import { Button, DropdownMenu, Icon, IconButton, Select, Tooltip } from "@webiny/admin-ui";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { Routes } from "~/routes.js";
import { normalizeIcon } from "~/utils/normalizeIcon.js";

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

interface ContentModelsDataListProps {
    canCreate: boolean;
    onCreate: () => void;
    onClone: (contentModel: CmsEditorContentModel) => void;
    showImportModelModal: () => void;
}

interface IconProps {
    model: Pick<CmsModel, "icon">;
}

const DisplayIcon = ({ model }: IconProps) => {
    if (!model.icon) {
        return null;
    }
    return (
        <UIL.ListItemGraphic>
            <div className={"text-neutral-muted"}>
                <Icon
                    size={"lg"}
                    color={"inherit"}
                    label={"Content model icon"}
                    icon={<FontAwesomeIcon icon={normalizeIcon(model.icon) as IconProp} />}
                />
            </div>
        </UIL.ListItemGraphic>
    );
};

const isHidden = (model: Pick<CmsModel, "tags">) => {
    if (!model.tags?.length) {
        return false;
    }
    return model.tags.includes("$hidden:true");
};

const ContentModelsDataList = ({
    canCreate,
    onCreate,
    onClone,
    showImportModelModal
}: ContentModelsDataListProps) => {
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(SORTERS[0].sorters);
    const { goToRoute } = useRouter();
    const { models, loading, refresh } = useModels();
    const { canDelete, canEdit } = usePermission();

    const [modelToBeDeleted, setModelToBeDeleted] = useState<CmsModel | null>(null);

    const filterData = useCallback(
        ({ name, tags }: Pick<CmsModel, "name" | "tags">): boolean => {
            if (isHidden({ tags })) {
                return false;
            }
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

    const editRecord = (contentModel: CmsModel): void => {
        goToRoute(Routes.ContentModels.Editor, { modelId: contentModel.modelId });
    };

    const viewContentEntries = useCallback((contentModel: Pick<CmsModel, "modelId">) => {
        return () => {
            goToRoute(Routes.ContentEntries.List, { modelId: contentModel.modelId });
        };
    }, []);

    const contentModelsDataListModalOverlay = useMemo(
        () => (
            <UIL.DataListModalOverlay>
                <Select
                    value={sort}
                    onChange={setSort}
                    label={t`Sort by`}
                    options={SORTERS.map(sorter => ({
                        label: sorter.label,
                        value: sorter.sorters
                    }))}
                />
            </UIL.DataListModalOverlay>
        ),
        [sort]
    );

    const filteredData = filter === "" ? models : models.filter(filterData);
    const contentModels = sortData(filteredData);

    const { handleModelsExport, handleModelExport } = useModelExport();

    const onRefreshClick = useCallback(() => {
        refresh();
    }, []);

    return (
        <>
            <UIL.DataList
                loading={loading}
                data={contentModels}
                title={t`Content Models`}
                actions={
                    <div className={"flex items-center justify-end gap-xs"}>
                        <Tooltip
                            content={"Export all models"}
                            trigger={
                                <IconButton
                                    icon={<DownloadFileIcon />}
                                    size={"sm"}
                                    variant={"ghost"}
                                    onClick={() => handleModelsExport()}
                                />
                            }
                        />
                        <Tooltip
                            content={"Import models"}
                            trigger={
                                <IconButton
                                    icon={<UploadFileIcon />}
                                    size={"sm"}
                                    variant={"ghost"}
                                    onClick={() => showImportModelModal()}
                                />
                            }
                        />
                        {canCreate ? (
                            <Button
                                data-testid="new-record-button"
                                onClick={onCreate}
                                text={t`New`}
                                icon={<AddIcon />}
                                size={"sm"}
                                className={"ml-xs"}
                            />
                        ) : null}
                    </div>
                }
                search={
                    <SearchUI
                        value={filter}
                        onChange={setFilter}
                        inputPlaceholder={t`Search content model...`}
                    />
                }
                modalOverlay={contentModelsDataListModalOverlay}
                modalOverlayAction={
                    <UIL.DataListModalOverlayAction data-testid={"default-data-list.filter"} />
                }
                refresh={onRefreshClick}
            >
                {({ data = [] }: { data: CmsModel[] }) => {
                    return (
                        <UIL.List data-testid="default-data-list">
                            {data.map(contentModel => {
                                const disableViewContent = contentModel.fields.length === 0;
                                const getMessage = () => {
                                    if (disableViewContent) {
                                        return "To view the entries, you first need to add a field and save the model";
                                    }

                                    if (contentModel.tags.includes(CMS_MODEL_SINGLETON_TAG)) {
                                        return "View";
                                    }

                                    return "View entries";
                                };

                                const canDeleteModel = canDelete(contentModel, "cms.contentModel");
                                const canEditModel = canEdit(contentModel, "cms.contentModel");

                                return (
                                    <UIL.ListItem
                                        key={contentModel.modelId}
                                        className={"group/item"}
                                    >
                                        <UIL.ListItemText>
                                            <DisplayIcon model={contentModel} />
                                            <UIL.ListItemTextPrimary>
                                                {contentModel.name}
                                            </UIL.ListItemTextPrimary>
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
                                        <UIL.ListItemMeta>
                                            <UIL.ListActions>
                                                <ModelIsBeingDeleted model={contentModel}>
                                                    <span
                                                        className={
                                                            "invisible group-hover/item:visible"
                                                        }
                                                    >
                                                        <Tooltip
                                                            side={"top"}
                                                            content={getMessage()}
                                                            trigger={
                                                                <Button
                                                                    text={"View entries"}
                                                                    icon={<ListIcon />}
                                                                    variant={"secondary"}
                                                                    size={"sm"}
                                                                    data-testid={
                                                                        "cms-view-content-model-button"
                                                                    }
                                                                    onClick={viewContentEntries(
                                                                        contentModel
                                                                    )}
                                                                    disabled={disableViewContent}
                                                                />
                                                            }
                                                        />
                                                    </span>

                                                    {canEdit(contentModel, "cms.contentModel") && (
                                                        <span
                                                            className={
                                                                "invisible group-hover/item:visible"
                                                            }
                                                        >
                                                            <Tooltip
                                                                side={"top"}
                                                                content={
                                                                    contentModel.plugin
                                                                        ? t`Content model is registered via a plugin.`
                                                                        : t`Edit content model`
                                                                }
                                                                trigger={
                                                                    <Button
                                                                        text={"Edit"}
                                                                        icon={<EditIcon />}
                                                                        variant={"secondary"}
                                                                        size={"sm"}
                                                                        disabled={
                                                                            contentModel.plugin
                                                                        }
                                                                        onClick={() =>
                                                                            editRecord(contentModel)
                                                                        }
                                                                        data-testid={
                                                                            "cms-edit-content-model-button"
                                                                        }
                                                                    />
                                                                }
                                                            />
                                                        </span>
                                                    )}

                                                    <DropdownMenu
                                                        trigger={
                                                            <IconButton
                                                                icon={<MoreVertIcon />}
                                                                size={"sm"}
                                                                variant={"ghost"}
                                                            />
                                                        }
                                                    >
                                                        {canEditModel && (
                                                            <DropdownMenu.Item
                                                                text={"Clone"}
                                                                icon={
                                                                    <DropdownMenu.Item.Icon
                                                                        label={"Clone"}
                                                                        element={<CloneIcon />}
                                                                    />
                                                                }
                                                                data-testid={
                                                                    "cms-clone-content-model-button"
                                                                }
                                                                onClick={() =>
                                                                    onClone(contentModel)
                                                                }
                                                            />
                                                        )}

                                                        <DropdownMenu.Item
                                                            text={"Export"}
                                                            icon={
                                                                <DropdownMenu.Item.Icon
                                                                    label={"Export"}
                                                                    element={<ExportIcon />}
                                                                />
                                                            }
                                                            data-testid={
                                                                "cms-export-content-model-button"
                                                            }
                                                            onClick={handleModelExport(
                                                                contentModel
                                                            )}
                                                        />

                                                        {canDeleteModel && (
                                                            <DropdownMenu.Item
                                                                text={"Delete"}
                                                                icon={
                                                                    <DropdownMenu.Item.Icon
                                                                        label={"Delete"}
                                                                        element={<DeleteIcon />}
                                                                    />
                                                                }
                                                                onClick={() => {
                                                                    setModelToBeDeleted(
                                                                        contentModel
                                                                    );
                                                                }}
                                                                data-testid={
                                                                    "cms-delete-content-model-button"
                                                                }
                                                                className={
                                                                    "text-destructive-primary! [&_svg]:fill-destructive"
                                                                }
                                                            />
                                                        )}
                                                    </DropdownMenu>
                                                </ModelIsBeingDeleted>
                                            </UIL.ListActions>
                                        </UIL.ListItemMeta>
                                    </UIL.ListItem>
                                );
                            })}
                        </UIL.List>
                    );
                }}
            </UIL.DataList>
            {modelToBeDeleted ? (
                <FullyDeleteModelDialog
                    model={modelToBeDeleted}
                    onClose={() => {
                        setModelToBeDeleted(null);
                    }}
                />
            ) : null}
        </>
    );
};

export default ContentModelsDataList;
