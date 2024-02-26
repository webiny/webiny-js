import styled from "@emotion/styled";
import React, { useCallback } from "react";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ReactComponent as RemoveIcon } from "./assets/remove.svg";
import { useConfirmationDialog } from "@webiny/app-admin";
import { ButtonLink } from "./elements/ButtonLink";

const Text = styled("span")({
    fontFamily: "Source Sans Pro",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "0.1px",
    textTransform: "uppercase"
});

interface RemoveProps {
    entry: CmsReferenceContentEntry;
    onRemove: (entryId: string) => void;
}

export const Remove = ({ entry, onRemove }: RemoveProps) => {
    const { showConfirmation } = useConfirmationDialog({
        title: "Remove referenced entry",
        message: `Are you sure you want to remove the referenced entry "${entry.title}"?`,
        acceptLabel: "Yes, I'm sure!"
    });

    const onRemoveClick = useCallback(() => {
        showConfirmation(() => {
            onRemove(entry.entryId);
        });
    }, [entry, onRemove]);

    return (
        <ButtonLink onClick={onRemoveClick} maxWidth={"100px"}>
            <RemoveIcon />
            <Text>Remove</Text>
        </ButtonLink>
    );
};
