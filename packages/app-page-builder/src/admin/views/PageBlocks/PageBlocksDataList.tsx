import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import isEmpty from "lodash/isEmpty";

import { useRouter } from "@webiny/react-router";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as DuplicateIcon } from "~/editor/assets/icons/round-queue-24px.svg";
import { ReactComponent as ExportIcon } from "@material-design-icons/svg/round/download.svg";
import { CircularProgress } from "@webiny/ui/Progress";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import useExportBlockDialog from "~/editor/plugins/defaultBar/components/ExportBlockButton/useExportBlockDialog";

import { PbPageBlock } from "~/types";
import { CreatableItem } from "./PageBlocks";
import { PreviewBlock } from "~/admin/components/PreviewBlock";
import { ResponsiveElementsProvider } from "~/admin/components/ResponsiveElementsProvider";
import { usePageBlocks } from "~/admin/contexts/AdminPageBuilder/PageBlocks/usePageBlocks";

const t = i18n.ns("app-page-builder/admin/page-blocks/data-list");

const List = styled("div")`
    display: flex;
    flex-direction: column;
    padding: 8px;
    margin: 17px 50px;
    background-color: white;
    box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%),
        0px 1px 3px 0px rgb(0 0 0 / 12%);
`;

const ListItem = styled.div`
    position: relative;
    border: 1px solid rgba(212, 212, 212, 0.5);
    box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%),
        0px 1px 3px 0px rgb(0 0 0 / 12%);
    min-height: 70px;
    padding: 15px;
    margin-bottom: 10px;
    :last-of-type {
        margin-bottom: 0;
    }
`;

const ListItemText = styled("div")({
    textTransform: "uppercase",
    alignSelf: "start",
    marginTop: "15px"
});

const Controls = styled("div")({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    transition: "opacity 0.2s ease-out",

    "&:hover": {
        opacity: 1
    }
});

const DeleteButton = styled(DeleteIcon)({
    position: "absolute",
    top: "10px",
    right: "10px",

    "& svg": {
        fill: "white"
    }
});

const EditButton = styled(EditIcon)({
    position: "absolute",
    top: "10px",
    right: "110px",

    "& svg": {
        fill: "white"
    }
});

const DuplicateButton = styled(IconButton)({
    position: "absolute",
    top: "10px",
    right: "60px",

    "& svg": {
        fill: "white"
    }
});

const ExportButton = styled(IconButton)({
    position: "absolute",
    top: "10px",
    right: "160px",

    "& svg": {
        fill: "white"
    }
});

const NoRecordsWrapper = styled("div")({
    textAlign: "center",
    padding: 100,
    color: "var(--mdc-theme-on-surface)"
});

type PageBlocksDataListProps = {
    filter: string;
    canCreate: boolean;
    canEdit: (item: CreatableItem) => boolean;
    canDelete: (item: CreatableItem) => boolean;
};

const PageBlocksDataList = ({ filter, canCreate, canEdit, canDelete }: PageBlocksDataListProps) => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [loadingLabel, setLoadingLabel] = useState("");
    const { showConfirmation } = useConfirmationDialog({
        title: "Delete page block",
        message: "Are you sure you want to delete this page block?"
    });
    const { showExportBlockInitializeDialog } = useExportBlockDialog();
    const pageBlocks = usePageBlocks();
    const [blocks, setPageBlocks] = useState<PbPageBlock[]>([]);

    const selectedBlocksCategory = new URLSearchParams(location.search).get("category");

    useEffect(() => {
        if (selectedBlocksCategory) {
            pageBlocks.listBlocks(selectedBlocksCategory).then(pageBlocks => {
                setPageBlocks(pageBlocks);
            });
        }
    }, [selectedBlocksCategory, pageBlocks.pageBlocks]);

    const filterData = useCallback(
        ({ name }) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const filteredBlocksData: PbPageBlock[] = filter === "" ? blocks : blocks.filter(filterData);

    const deleteItem = useCallback(
        (pageBlock: PbPageBlock) => {
            showConfirmation(async () => {
                try {
                    await pageBlocks.deleteBlock(pageBlock.id);
                    showSnackbar(t`Block "{name}" deleted.`({ name: pageBlock.name }));
                } catch (error) {
                    showSnackbar(error.message);
                }
            });
        },
        [selectedBlocksCategory]
    );

    const duplicateItem = useCallback(async item => {
        setLoadingLabel(t`Creating a copy of "{name}"...`({ name: item.name }));

        const newName = `${item.name} (copy)`;
        try {
            await pageBlocks.createBlock({
                name: newName,
                category: item.blockCategory,
                content: item.content
            });
        } catch (error) {
            showSnackbar(error.message);
        }

        showSnackbar(t`"{name}" was created successfully!`({ name: newName }));
    }, []);

    const handleExportClick = useCallback((id: string) => {
        showExportBlockInitializeDialog({ ids: [id] });
    }, []);

    const showEmptyView = !pageBlocks.loading && !selectedBlocksCategory;

    // Render "No content selected" view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display list of page blocks for selected category`}
                action={null}
            />
        );
    }

    const showNoRecordsView = !pageBlocks.loading && isEmpty(filteredBlocksData);
    // Render "No records found" view.
    if (showNoRecordsView) {
        return (
            <NoRecordsWrapper>
                <Typography use="overline">No records found.</Typography>
            </NoRecordsWrapper>
        );
    }

    return (
        <List>
            {pageBlocks.loading && (
                <CircularProgress label={loadingLabel || pageBlocks.loadingLabel || "Loading..."} />
            )}
            <ResponsiveElementsProvider>
                {filteredBlocksData.map(pageBlock => (
                    <ListItem key={pageBlock.id}>
                        <PreviewBlock element={pageBlock} />
                        <ListItemText>{pageBlock.name}</ListItemText>
                        <Controls>
                            <ExportButton
                                data-testid={"pb-blocks-list-block-export-btn"}
                                icon={<ExportIcon />}
                                onClick={() => handleExportClick(pageBlock.id)}
                            />
                            {canEdit(pageBlock) && (
                                <EditButton
                                    data-testid={"pb-blocks-list-block-edit-btn"}
                                    onClick={() =>
                                        history.push(`/page-builder/block-editor/${pageBlock.id}`)
                                    }
                                />
                            )}
                            {canCreate && (
                                <DuplicateButton
                                    data-testid={"pb-blocks-list-block-duplicate-btn"}
                                    icon={<DuplicateIcon />}
                                    onClick={() => duplicateItem(pageBlock)}
                                />
                            )}
                            {canDelete(pageBlock) && (
                                <DeleteButton
                                    data-testid={"pb-blocks-list-block-delete-btn"}
                                    onClick={() => deleteItem(pageBlock)}
                                />
                            )}
                        </Controls>
                    </ListItem>
                ))}
            </ResponsiveElementsProvider>
        </List>
    );
};

export default PageBlocksDataList;
