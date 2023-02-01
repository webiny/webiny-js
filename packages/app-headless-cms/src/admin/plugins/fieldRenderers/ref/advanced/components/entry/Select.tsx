import styled from "@emotion/styled";
import React, { useCallback, useState } from "react";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ReactComponent as SelectedIcon } from "./assets/selected.svg";

const Container = styled("div")({
    color: "#FA5723",
    width: "140px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
});

interface IconProps {
    selected?: boolean;
}
const Icon = styled("div")(({ selected }: IconProps) => {
    return {
        backgroundColor: selected ? "#FA5723" : "transparent",
        border: "1px solid #FA5723",
        borderRadius: "3px",
        width: "16px",
        height: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer"
    };
});

const Text = styled("div")({
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "20px",
    letterSpacing: "0.1px",
    textTransform: "uppercase",
    marginLeft: "10px"
});

interface Props {
    entry: CmsReferenceContentEntry;
}
export const Select: React.FC<Props> = ({ entry }) => {
    const [selected, setSelected] = useState(false);
    const onIconClick = useCallback(() => {
        setSelected(!selected);
    }, [entry, selected]);
    return (
        <Container>
            <Icon selected={selected} onClick={onIconClick}>
                <SelectedIcon />
            </Icon>
            <Text>{selected ? "Selected" : "Select"}</Text>
        </Container>
    );
};
