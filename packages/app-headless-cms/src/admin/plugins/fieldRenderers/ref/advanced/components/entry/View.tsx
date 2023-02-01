import styled from "@emotion/styled";
import React from "react";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ReactComponent as ViewIcon } from "./assets/view.svg";

const Container = styled("div")({
    color: "#FA5723",
    width: "110px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto"
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
export const View: React.FC<Props> = ({ entry }) => {
    return (
        <Container>
            <ViewIcon /> <Text>View</Text>
        </Container>
    );
};
