import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { CmsModel } from "~/types";
import { OptionsModelList } from "~/admin/plugins/fieldRenderers/ref/advanced/components/options/OptionsModelList";

const Container = styled("div")({
    display: "flex",
    flexDirection: "row",
    width: "100%"
});
const NewRecord = styled("div")({
    borderRight: "2px solid var(--mdc-theme-background)",
    padding: "10px 15px",
    display: "flex",
    position: "relative",
    " > div ": {
        display: "none"
    },
    ":hover > div": {
        display: "block"
    }
});
const NewRecordButton = styled("button")({
    background: "transparent",
    border: "none",
    color: "var(--mdc-theme-primary)",
    padding: "2px 2px",
    cursor: "pointer"
});
const LinkExistingRecord = styled("div")({
    padding: "10px 15px",
    display: "flex",
    position: "relative",
    " > div ": {
        display: "none"
    },
    ":hover > div": {
        display: "block"
    }
});
const LinkExistingRecordButton = styled("button")({
    background: "transparent",
    border: "none",
    color: "var(--mdc-theme-primary)",
    padding: "2px 5px",
    cursor: "pointer"
});

interface Props {
    models: CmsModel[];
    onNewRecord: (modelId: string) => void;
    onLinkExistingRecord: (modelId: string) => void;
}
export const Options: React.FC<Props> = ({ models, onNewRecord, onLinkExistingRecord }) => {
    const hasMultipleModels = models.length > 1;
    const onSingleNewRecord = useCallback(() => {
        if (models.length === 0 || hasMultipleModels) {
            return;
        }
        onNewRecord(models[0].modelId);
    }, [models]);

    const onSingleExistingRecord = useCallback(() => {
        if (models.length === 0 || hasMultipleModels) {
            return;
        }
        onLinkExistingRecord(models[0].modelId);
    }, [models]);
    return (
        <Container>
            <NewRecord>
                <NewRecordButton
                    style={hasMultipleModels ? { cursor: "default" } : {}}
                    onClick={onSingleNewRecord}
                >
                    + create a new record
                </NewRecordButton>
                <OptionsModelList onClick={onNewRecord} models={models} />
            </NewRecord>
            <LinkExistingRecord>
                <LinkExistingRecordButton onClick={onSingleExistingRecord}>
                    (+) link existing record
                </LinkExistingRecordButton>
                <OptionsModelList onClick={onLinkExistingRecord} models={models} />
            </LinkExistingRecord>
        </Container>
    );
};
