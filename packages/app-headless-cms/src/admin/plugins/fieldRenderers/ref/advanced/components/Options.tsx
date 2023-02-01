import React from "react";
import { CmsEditorFieldRendererProps } from "~/types";
import styled from "@emotion/styled";

const Container = styled("div")({
    display: "flex",
    flexDirection: "row",
    width: "100%"
});
const NewRecord = styled("div")({});
const NewRecordButton = styled("button")({});
const LinkExistingRecord = styled("div")({});
const LinkExistingRecordButton = styled("button")({});

interface Props {
    onNewRecord: () => void;
    onLinkExistingRecord: () => void;
}
export const Options: React.FC<Props> = ({ onNewRecord, onLinkExistingRecord }) => {
    return (
        <Container>
            <NewRecord>
                <NewRecordButton onClick={onNewRecord}>create a new record</NewRecordButton>
            </NewRecord>
            <LinkExistingRecord>
                <LinkExistingRecordButton onClick={onLinkExistingRecord}>
                    link existing record
                </LinkExistingRecordButton>
            </LinkExistingRecord>
        </Container>
    );
};
