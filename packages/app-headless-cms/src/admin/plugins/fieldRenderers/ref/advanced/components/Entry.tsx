import React from "react";
import styled from "@emotion/styled";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { Image } from "./entry/Image";
import { ModelName } from "./entry/ModelName";
import { Title } from "./entry/Title";
import { Description } from "./entry/Description";
import { Status } from "./entry/Status";
import { CreatedBy } from "./entry/CreatedBy";
import { ModifiedBy } from "./entry/ModifiedBy";
import { View } from "./entry/View";
import { Select } from "./entry/Select";

const Container = styled("div")({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
    marginBottom: "10px"
});

const ContentContainer = styled("div")({
    width: "100%",
    display: "flex",
    flexDirection: "row"
});

const Content = styled("div")({
    display: "flex",
    flexDirection: "column",
    paddingLeft: "16px",
    paddingTop: "18px"
});

const FooterContainer = styled("div")({
    display: "flex",
    flexDirection: "row",
    padding: "10px"
});

interface Props {
    entry?: CmsReferenceContentEntry | null;
}
export const Entry: React.FC<Props> = ({ entry }) => {
    if (!entry) {
        return null;
    }
    return (
        <Container>
            <ContentContainer>
                <Image title={entry.title} src={entry.image} />
                <Content>
                    <ModelName name={"modelName"} />
                    <Title title={entry.title} />
                    <Description description={entry.description} />
                </Content>
            </ContentContainer>
            <FooterContainer>
                <Status status={entry.status} />
                <CreatedBy createdBy={entry.createdBy} createdOn={entry.createdOn} />
                <ModifiedBy modifiedBy={entry.modifiedBy} savedOn={entry.savedOn} />
                <View entry={entry} />
                <Select entry={entry} />
            </FooterContainer>
        </Container>
    );
};
