import React from "react";
import styled from "@emotion/styled";
import { useQuery } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty";

import { useRouter } from "@webiny/react-router";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { CircularProgress } from "@webiny/ui/Progress";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

import { PbPageBlock } from "~/types";
import { LIST_PAGE_BLOCKS } from "./graphql";
import { CreatableItem } from "./PageBlocks";

const t = i18n.ns("app-page-builder/admin/page-blocks/data-list");

const List = styled("div")({
    display: "grid",
    rowGap: "8px",
    padding: "8px",
    margin: "17px 50px",
    backgroundColor: "white",
    boxShadow:
        "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)"
});

const ListItem = styled("div")({
    position: "relative",
    display: "flex",
    alignItems: "end",
    border: "1px solid rgba(212, 212, 212, 0.5)",
    boxShadow:
        "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)",
    height: "120px",
    padding: "24px"
});

const ListItemText = styled("span")({
    textTransform: "uppercase"
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
    left: "10px",

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
    canEdit: (item: CreatableItem) => boolean;
    canDelete: (item: CreatableItem) => boolean;
};

const PageBlocksDataList = ({ canEdit, canDelete }: PageBlocksDataListProps) => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();

    const selectedBlocksCategory = new URLSearchParams(location.search).get("category");

    const listPageBlocksQuery = useQuery(LIST_PAGE_BLOCKS, {
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

    const pageBlocksData: PbPageBlock[] =
        listPageBlocksQuery?.data?.pageBuilder?.listPageBlocks?.data || [];

    const loading = [listPageBlocksQuery].find(item => item.loading);

    const showEmptyView = !loading && !selectedBlocksCategory;
    // Render "No content selected" view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display list of page blocks for selected category`}
                action={null}
            />
        );
    }

    const showNoRecordsView = !loading && isEmpty(pageBlocksData);
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
            {loading && <CircularProgress />}
            {pageBlocksData.map(pageBlock => (
                <ListItem key={pageBlock.id}>
                    <ListItemText>{pageBlock.name}</ListItemText>
                    <Controls>
                        {canEdit(pageBlock) && <EditButton />}
                        {canDelete(pageBlock) && <DeleteButton />}
                    </Controls>
                </ListItem>
            ))}
        </List>
    );
};

export default PageBlocksDataList;
