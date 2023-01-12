import React, { useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { useQuery, useMutation } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty";

import { useRouter } from "@webiny/react-router";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as DuplicateIcon } from "~/editor/assets/icons/round-queue-24px.svg";
import { CircularProgress } from "@webiny/ui/Progress";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

import { PbPageBlock } from "~/types";
import {
    LIST_PAGE_BLOCKS,
    LIST_PAGE_BLOCKS_AND_CATEGORIES,
    CREATE_PAGE_BLOCK,
    DELETE_PAGE_BLOCK
} from "./graphql";
import { CreatableItem } from "./PageBlocks";
import previewFallback from "./assets/preview.png";

const t = i18n.ns("app-page-builder/admin/page-blocks/data-list");

const List = styled("div")({
    display: "grid",
    rowGap: "20px",
    padding: "8px",
    margin: "17px 50px",
    backgroundColor: "white",
    boxShadow:
        "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)"
});

const ListItem = styled("div")({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "end",
    border: "1px solid rgba(212, 212, 212, 0.5)",
    boxShadow:
        "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)",
    minHeight: "70px",
    padding: "15px"
});

const ListItemText = styled("span")({
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

const NoRecordsWrapper = styled("div")({
    textAlign: "center",
    padding: 100,
    color: "var(--mdc-theme-on-surface)"
});

type PageBlocksDataListProps = {
    canCreate: boolean;
    canEdit: (item: CreatableItem) => boolean;
    canDelete: (item: CreatableItem) => boolean;
};

const PageBlocksDataList = ({ canCreate, canEdit, canDelete }: PageBlocksDataListProps) => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();

    const selectedBlocksCategory = new URLSearchParams(location.search).get("category");

    const { data, loading, refetch } = useQuery(LIST_PAGE_BLOCKS, {
        variables: { blockCategory: selectedBlocksCategory as string },
        skip: !selectedBlocksCategory,
        onCompleted: data => {
            const error = data?.pageBuilder?.listPageBlocks?.error;
            if (error) {
                history.push("/page-builder/page-blocks");
                showSnackbar(error.message);
            }
        }
    });

    useEffect(() => {
        if (selectedBlocksCategory) {
            refetch();
        }
    }, [selectedBlocksCategory]);

    const [deleteIt, deleteMutation] = useMutation(DELETE_PAGE_BLOCK, {
        // To update block counters on the left side
        refetchQueries: [{ query: LIST_PAGE_BLOCKS_AND_CATEGORIES }],
        onCompleted: () => refetch()
    });

    const [duplicateIt, duplicateMutation] = useMutation(CREATE_PAGE_BLOCK, {
        // To update block counters on the left side and blocks list in pageEditor
        refetchQueries: [{ query: LIST_PAGE_BLOCKS_AND_CATEGORIES }, { query: LIST_PAGE_BLOCKS }],
        onCompleted: () => refetch()
    });

    const pageBlocksData: PbPageBlock[] = data?.pageBuilder?.listPageBlocks?.data || [];

    const deleteItem = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const error = response?.data?.pageBuilder?.deletePageBlock?.error;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Block "{name}" deleted.`({ name: item.name }));
            });
        },
        [selectedBlocksCategory]
    );

    const duplicateItem = useCallback(
        async item => {
            const response = await duplicateIt({
                variables: {
                    data: {
                        name: `${item.name} (copy)`,
                        blockCategory: item.blockCategory,
                        content: item.content,
                        preview: item.preview
                    }
                }
            });

            const error = response?.data?.pageBuilder?.deletePageBlock?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            showSnackbar(t`Duplicated "{name}".`({ name: item.name }));
        },
        [duplicateIt]
    );

    const isLoading = [deleteMutation, duplicateMutation].find(item => item.loading) || loading;

    const showEmptyView = !isLoading && !selectedBlocksCategory;
    // Render "No content selected" view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display list of page blocks for selected category`}
                action={null}
            />
        );
    }

    const showNoRecordsView = !isLoading && isEmpty(pageBlocksData);
    // Render "No records found" view.
    if (showNoRecordsView) {
        return (
            <NoRecordsWrapper>
                <Typography use="overline">No records found.</Typography>
            </NoRecordsWrapper>
        );
    }

    return (
        <>
            <List>
                {isLoading && <CircularProgress />}
                {pageBlocksData.map(pageBlock => (
                    <ListItem key={pageBlock.id}>
                        <img
                            src={pageBlock?.preview?.src || previewFallback}
                            alt={pageBlock.name}
                        />
                        <ListItemText>{pageBlock.name}</ListItemText>
                        <Controls>
                            {canEdit(pageBlock) && (
                                <EditButton
                                    onClick={() =>
                                        history.push(`/page-builder/block-editor/${pageBlock.id}`)
                                    }
                                />
                            )}
                            {canCreate && (
                                <DuplicateButton
                                    icon={<DuplicateIcon />}
                                    onClick={() => duplicateItem(pageBlock)}
                                />
                            )}
                            {canDelete(pageBlock) && (
                                <DeleteButton onClick={() => deleteItem(pageBlock)} />
                            )}
                        </Controls>
                    </ListItem>
                ))}
            </List>
        </>
    );
};

export default PageBlocksDataList;
