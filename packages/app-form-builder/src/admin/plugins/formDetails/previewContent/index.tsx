import React, { useEffect, useState } from "react";
import { Tab } from "@webiny/ui/Tabs";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import FormPreview from "./FormPreview";
import Header from "./Header";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import { FbFormDetailsPluginRenderParams, FbFormDetailsPluginType } from "~/types";

const t = i18n.namespace("FormsApp.FormDetails.PreviewContent");

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    overflow: "auto",
    padding: 25
});

const PreviewContentTab = (props: FbFormDetailsPluginRenderParams) => {
    const [revisionId, setRevisionId] = useState<string>();

    useEffect((): void => {
        if (!props.revisions.length) {
            return;
        }
        setRevisionId(props.form.id);
    }, [props.form.id, props.revisions.length]);

    const revision = props.revisions.find(item => item.id === revisionId);
    if (!revision) {
        return null;
    }

    return (
        <RenderBlock>
            <Elevation z={2}>
                <div style={{ position: "relative" }}>
                    {props.loading && <CircularProgress />}
                    <Header
                        {...props}
                        revision={revision}
                        selectRevision={revision => setRevisionId(revision.id)}
                    />
                    <FormPreview revision={revision} form={props.form} />
                </div>
            </Elevation>
        </RenderBlock>
    );
};

export default [
    {
        name: "forms-form-details-revision-content-preview",
        type: "forms-form-details-revision-content",
        render(props) {
            return (
                <Tab
                    label={t`Form preview`}
                    disabled={props.loading}
                    data-testid={"fb.form-details.tab.form-preview"}
                >
                    <PreviewContentTab {...props} />
                </Tab>
            );
        }
    }
] as FbFormDetailsPluginType[];
