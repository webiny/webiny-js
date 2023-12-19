import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { CmsModel } from "~/types";
import { OptionsModelList } from "~/admin/plugins/fieldRenderers/ref/advanced/components/options/OptionsModelList";
import { ReactComponent as LinkIcon } from "./assets/link.svg";
import { ReactComponent as AddIcon } from "./assets/add-circle.svg";

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
    alignItems: "center",
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
    cursor: "pointer",
    alignItems: "center",
    display: "flex",
    "> svg": {
        color: "var(--mdc-theme-primary)",
        width: "16px",
        height: "16px",
        marginRight: 10
    }
});
const LinkExistingRecord = styled("div")({
    padding: "10px 15px",
    alignItems: "center",
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
    cursor: "pointer",
    alignItems: "center",
    display: "flex",
    "> svg": {
        color: "var(--mdc-theme-primary)",
        width: "16px",
        height: "16px",
        marginRight: 10
    }
});

interface OptionsProps {
    models: CmsModel[];
    onNewRecord: (modelId: string) => void;
    onLinkExistingRecord: (modelId: string) => void;
}
export const Options = ({ models, onNewRecord, onLinkExistingRecord }: OptionsProps) => {
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
                <NewRecordButton onClick={onSingleNewRecord}>
                    <AddIcon /> create a new record
                </NewRecordButton>
                <OptionsModelList onClick={onNewRecord} models={models} />
            </NewRecord>
            <LinkExistingRecord>
                <LinkExistingRecordButton onClick={onSingleExistingRecord}>
                    <LinkIcon /> link an existing record
                </LinkExistingRecordButton>
                <OptionsModelList onClick={onLinkExistingRecord} models={models} />
            </LinkExistingRecord>
        </Container>
    );
};
