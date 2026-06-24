import React, { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import orderBy from "lodash/orderBy.js";
import { TimeAgo } from "@webiny/admin-ui";
import { SearchUI, useRouter, useSnackbar } from "@webiny/app-admin";
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
import { DataList, DataListModal, List } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsEditorContentModel, CmsModel } from "~/types.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { ModelIsBeingDeleted } from "~/admin/views/contentModels/fullDelete/ModelIsBeingDeleted.js";
import { FullyDeleteModelDialog } from "~/admin/views/contentModels/fullDelete/FullyDeleteModelDialog.js";
import { Button, DropdownMenu, Icon, IconButton, Select, Tooltip } from "@webiny/admin-ui";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { Routes } from "~/routes.js";
import { normalizeIcon } from "~/utils/normalizeIcon.js";
import { useContentModelsPresenter } from "../useContentModelsPresenter.js";
import { download } from "~/admin/views/contentModels/exporting/download.js";

const t = i18n.namespace("FormsApp.ContentModelsDataList");

const SORTERS = [
    { label: "Newest to oldest", sorter: "savedOn_DESC" },
    { label: "Oldest to newest", sorter: "savedOn_ASC" },
    { label: "Name A-Z", sorter: "name_ASC" },
    { label: "Name Z-A", sorter: "name_DESC" }
];

const deserializeSorters = (data: string): [string, "asc" | "desc"] => {
    const [field, order] = data.split("_");
    return [field, order.toLowerCase() === "asc" ? "asc" : "desc"];
};

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
        <div className={"text-neutral-muted"}>
            <Icon
                size={"lg"}
                color={"inherit"}
                label={"Content model icon"}
                icon={<FontAwesomeIcon icon={normalizeIcon(model.icon) as IconProp} />}
            />
        </div>
    );
};

const ContentModelsDataList = observer(
    ({ canCreate, onCreate, onClone, showImportModelModal }: ContentModelsDataListProps) => {
        const presenter = useContentModelsPresenter();
        const { goToRoute } = useRouter();
        const { showSnackbar } = useSnackbar();
        const { canDelete, canEdit } = usePermission();

        const [filter, setFilter] = useState("");
        const [sort, setSort] = useState(SORTERS[0].sorter);
        const [modelToBeDeleted, setModelToBeDeleted] = useState<CmsModel | null>(null);

        const models = presenter.vm.models;
        const loading = presenter.vm.loading;

        const filteredData = useMemo(() => {
            if (filter === "") {
                return models;
            }
            const lc = filter.toLowerCase();
            return models.filter((m: CmsModel) => m.name.toLowerCase().includes(lc));
        }, [models, filter]);

        const sortedData = useMemo(() => {
            if (!sort) {
                return filteredData;
            }
            const [key, order] = deserializeSorters(sort);
            return orderBy(filteredData, [key], [order]);
        }, [filteredData, sort]);

        const editRecord = (contentModel: CmsModel): void => {
            goToRoute(Routes.ContentModels.Editor, { modelId: contentModel.modelId });
        };

        const viewContentEntries = useCallback((contentModel: Pick<CmsModel, "modelId">) => {
            return () => {
                goToRoute(Routes.ContentEntries.List, { modelId: contentModel.modelId });
            };
        }, []);

        const handleModelsExport = useCallback(
            (modelIds?: string[]) => {
                (async () => {
                    try {
                        const data = await presenter.exportModels(modelIds);
                        if (!data || !data.models || data.models.length === 0) {
                            showSnackbar("No data returned from the export query.");
                            return;
                        }
                        download(data);
                    } catch (e: any) {
                        showSnackbar(e.message);
                    }
                })();
            },
            [presenter]
        );

        const handleModelExport = useCallback(
            (model: CmsModel) => {
                return () => {
                    handleModelsExport([model.modelId]);
                };
            },
            [handleModelsExport]
        );

        return (
            <>
                <DataList
                    loading={loading}
                    data={sortedData}
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
                    modalOverlay={
                        <DataListModal.Content>
                            <Select
                                value={sort}
                                onChange={setSort}
                                label={t`Sort by`}
                                options={SORTERS.map(({ label, sorter: value }) => ({
                                    label,
                                    value
                                }))}
                            />
                        </DataListModal.Content>
                    }
                    modalOverlayAction={
                        <DataListModal.Trigger data-testid={"default-data-list.filter"} />
                    }
                    refresh={null}
                >
                    {({ data = [] }: { data: CmsModel[] }) => {
                        return (
                            <List data-testid="default-data-list">
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

                                    const canDeleteModel = canDelete(
                                        contentModel,
                                        "cms.contentModel"
                                    );
                                    const canEditModel = canEdit(
                                        contentModel,
                                        "cms.contentModel"
                                    );

                                    return (
                                        <List.Item
                                            key={contentModel.modelId}
                                            className={"group/item"}
                                            icon={<DisplayIcon model={contentModel} />}
                                            title={contentModel.name}
                                            description={t`Last modified: {time}.`({
                                                time: contentModel.savedOn ? (
                                                    <TimeAgo datetime={contentModel.savedOn} />
                                                ) : (
                                                    "N/A"
                                                )
                                            })}
                                            actions={
                                                <>
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
                                                                        disabled={
                                                                            disableViewContent
                                                                        }
                                                                    />
                                                                }
                                                            />
                                                        </span>

                                                        {canEditModel && (
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
                                                                                editRecord(
                                                                                    contentModel
                                                                                )
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
                                                                            element={
                                                                                <DeleteIcon />
                                                                            }
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
                                                </>
                                            }
                                        />
                                    );
                                })}
                            </List>
                        );
                    }}
                </DataList>
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
    }
);

export default ContentModelsDataList;
