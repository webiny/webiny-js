// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";
import type { CmsPageDetailsPluginType, WithFormDetailsProps } from "webiny-app-forms/types";
import { Tab } from "webiny-ui/Tabs";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";
import FormSubmissions from "./FormSubmissions";
import { CircularProgress } from "webiny-ui/Progress";

import { i18n } from "webiny-app/i18n";
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
        render({ form, loading, refreshPages }: WithFormDetailsProps) {
            return (
                <Tab label={t`Submissions`} disabled={loading}>
                    <RenderBlock>
                        <Elevation z={2}>
                            <div style={{ position: "relative" }}>
                                {loading && <CircularProgress />}
                                {renderPlugins("forms-form-details-revision-content-submissions", {
                                    form,
                                    refreshPages
                                })}
                            </div>
                        </Elevation>
                    </RenderBlock>
                </Tab>
            );
        }
    },
    {
        name: "forms-form-details-revision-render",
        type: "forms-form-details-revision-content-submissions",
        render({ form }: WithFormDetailsProps) {
            return <FormSubmissions form={form} />;
        }
    }
]: Array<CmsPageDetailsPluginType>);
