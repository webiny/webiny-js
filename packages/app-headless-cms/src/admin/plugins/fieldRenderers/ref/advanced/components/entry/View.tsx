import styled from "@emotion/styled";
import { css } from "emotion";
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

const Text = styled("div")({});

const urlStyle = css({
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "20px",
    letterSpacing: "0.1px",
    textTransform: "uppercase"
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
            <a className={urlStyle} href={createEntryUrl(entry)} target="_blank" rel="noreferrer">
                <ViewIcon /> <Text>View</Text>
            </a>
        </Container>
    );
};
