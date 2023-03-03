import styled from "@emotion/styled";
import React, { useCallback } from "react";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ReactComponent as RemoveIcon } from "./assets/remove.svg";
import { useConfirmationDialog } from "@webiny/app-admin";

const Container = styled("div")({
    width: "140px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
});

const SelectButton = styled("button")({
    border: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    background: "transparent",
    color: "var(--mdc-theme-primary)",
    cursor: "pointer"
});

const Icon = styled("div")(() => {
    return {
        width: "16px",
        height: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer"
    };
});

const Text = styled("span")({
    fontFamily: "Source Sans Pro",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "0.1px",
    textTransform: "uppercase",
    marginLeft: "10px"
});

interface Props {
    entry: CmsReferenceContentEntry;
    onRemove: (entryId: string) => void;
}
export const Remove: React.FC<Props> = ({ entry, onRemove }) => {
    const { showConfirmation } = useConfirmationDialog({
        title: "Remove referenced entry",
        message: `Are you sure you want to remove the referenced entry "${entry.title}"?`,
        acceptLabel: "Yes, I'm sure!"
    });

    const onRemoveClick = useCallback(() => {
        showConfirmation(() => {
            onRemove(entry.entryId);
        });
    }, [entry]);

    return (
        <Container>
            <SelectButton onClick={onRemoveClick}>
                <Icon>
                    <RemoveIcon />
                </Icon>
                <Text>Remove</Text>
            </SelectButton>
        </Container>
    );
};
