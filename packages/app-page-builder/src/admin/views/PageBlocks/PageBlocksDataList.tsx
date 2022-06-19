import React, { useMemo } from "react";
import styled from "@emotion/styled";
import { useQuery } from "@apollo/react-hooks";

import { useRouter } from "@webiny/react-router";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { CircularProgress } from "@webiny/ui/Progress";

import { PbPageBlock } from "~/types";
import { LIST_PAGE_BLOCKS_AND_CATEGORIES } from "./graphql";
import { CreatableItem } from "./PageBlocks";

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

type PageBlocksDataListProps = {
    canEdit: (item: CreatableItem) => boolean;
    canDelete: (item: CreatableItem) => boolean;
};

const PageBlocksDataList = ({ canEdit, canDelete }: PageBlocksDataListProps) => {
    const { location } = useRouter();

    const listQuery = useQuery(LIST_PAGE_BLOCKS_AND_CATEGORIES);

    const selectedBlocksCategory = new URLSearchParams(location.search).get("category");
    const pageBlocksData: PbPageBlock[] = listQuery?.data?.pageBuilder?.listPageBlocks?.data || [];
    const pageBlocksList = useMemo((): PbPageBlock[] => {
        return pageBlocksData.filter(
            pageBlock => pageBlock.blockCategory === selectedBlocksCategory
        );
    }, [selectedBlocksCategory, pageBlocksData]);

    const loading = [listQuery].find(item => item.loading);

    return (
        <>
            {pageBlocksList.length > 0 && (
                <List>
                    {loading && <CircularProgress />}
                    {pageBlocksList.map(pageBlock => (
                        <ListItem key={pageBlock.id}>
                            <ListItemText>{pageBlock.name}</ListItemText>
                            <Controls>
                                {canEdit(pageBlock) && <EditButton />}
                                {canDelete(pageBlock) && <DeleteButton />}
                            </Controls>
                        </ListItem>
                    ))}
                </List>
            )}
        </>
    );
};

export default PageBlocksDataList;
