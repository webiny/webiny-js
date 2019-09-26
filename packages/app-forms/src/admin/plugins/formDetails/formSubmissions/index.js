// @flow
import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { Tab } from "@webiny/ui/Tabs";
import styled from "@emotion/styled";
import FormSubmissionsOverview from "./FormSubmissionsOverview";
import FormSubmissionsList from "./FormSubmissionsList";
import { CircularProgress } from "@webiny/ui/Progress";
import type { PluginType } from "@webiny/plugins/types";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormsApp.FormDetails.PreviewContent");

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    overflow: "scroll",
    padding: 25
});

export default ([
    {
        name: "forms-form-details-revision-content-submissions",
        type: "forms-form-details-revision-content",
        render({ form, loading, refreshPages }) {
            return (
                <Tab label={t`Submissions`} disabled={loading}>
                    <RenderBlock>
                        <div style={{ position: "relative" }}>
                            {loading && <CircularProgress />}
                            {form &&
                                renderPlugins("forms-form-details-submissions", {
                                    form,
                                    refreshPages
                                })}
                        </div>
                    </RenderBlock>
                </Tab>
            );
        }
    },
    {
        name: "forms-form-details-submissions-overview",
        type: "forms-form-details-submissions",
        render({ form }) {
            return <FormSubmissionsOverview form={form} />;
        }
    },
    {
        name: "forms-form-details-submissions-list",
        type: "forms-form-details-submissions",
        render({ form }) {
            return <FormSubmissionsList form={form} />;
        }
    }
]: Array<PluginType & Object>);
