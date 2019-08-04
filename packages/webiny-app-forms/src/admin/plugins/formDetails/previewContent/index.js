// @flow
// $FlowFixMe
import React, { useEffect, useState } from "react";
import { Tab } from "webiny-ui/Tabs";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";
import FormPreview from "./FormPreview";
import Header from "./Header";
import { CircularProgress } from "webiny-ui/Progress";
import { i18n } from "webiny-app/i18n";
import type { FormDetailsPluginType } from "webiny-app-forms/types";

const t = i18n.namespace("FormsApp.FormDetails.PreviewContent");

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    overflow: "scroll",
    padding: 25
});

const PreviewContentTab = props => {
    const [revisionId, setRevisionId] = useState();
    useEffect(() => {
        setRevisionId(props.form.revisions[0].id);
    }, [props.form.id]);

    const revision = props.form.revisions.find(item => item.id === revisionId);
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
                    <FormPreview revision={revision} />
                </div>
            </Elevation>
        </RenderBlock>
    );
};

export default ([
    {
        name: "forms-form-details-revision-content-preview",
        type: "forms-form-details-revision-content",
        render(props) {
            return (
                <Tab label={t`Form preview`} disabled={props.loading}>
                    <PreviewContentTab {...props} />
                </Tab>
            );
        }
    }
]: Array<FormDetailsPluginType>);
