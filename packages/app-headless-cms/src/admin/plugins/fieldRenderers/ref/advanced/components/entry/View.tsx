import styled from "@emotion/styled";
import { css } from "emotion";
import React from "react";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ReactComponent as ViewIcon } from "./assets/view.svg";

const Container = styled("div")({
    width: "110px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto"
});

const ViewTag = styled("a")({
    display: "flex",
    width: "auto",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "0.1px",
    textTransform: "uppercase",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--mdc-theme-primary)",
    " > svg": {
        marginRight: "10px"
    }
});

const createEntryUrl = (entry: CmsReferenceContentEntry) => {
    return `/cms/content-entries/${entry.model.modelId}?id=${entry.id}`;
};

interface Props {
    entry: CmsReferenceContentEntry;
}
export const View: React.FC<Props> = ({ entry }) => {
    return (
        <Container>
            <ViewTag href={createEntryUrl(entry)} target="_blank">
                <ViewIcon /> <span>View</span>
            </ViewTag>
        </Container>
    );
};
