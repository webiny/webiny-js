import styled from "@emotion/styled";
import React, { useCallback, useState } from "react";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ReactComponent as SelectedIcon } from "./assets/selected.svg";

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

interface IconProps {
    selected?: boolean;
}
const Icon = styled("div")(({ selected }: IconProps) => {
    return {
        backgroundColor: selected ? "var(--mdc-theme-primary)" : "transparent",
        border: "1px solid var(--mdc-theme-primary)",
        borderRadius: "3px",
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
    selected?: boolean;
    onChange: (value: CmsReferenceValue | null) => void;
}
export const Select: React.FC<Props> = ({ entry, selected, onChange }) => {
    const onIconClick = useCallback(() => {
        if (selected) {
            onChange(null);
            return;
        }
        onChange({
            id: entry.id,
            modelId: entry.model.modelId
        });
    }, [entry, selected, onChange]);
    return (
        <Container>
            <SelectButton onClick={onIconClick}>
                <Icon selected={selected}>{selected && <SelectedIcon />}</Icon>
                <Text>{selected ? "Selected" : "Select"}</Text>
            </SelectButton>
        </Container>
    );
};
