// @flow
import * as React from "react";
import type { CmsPageDetailsPluginType, WithFormDetailsProps } from "webiny-app-forms/types";
import { Tab } from "webiny-ui/Tabs";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";
import FormPreview from "./FormPreview";
import Header from "./Header";
import headerPlugins from "./headerPlugins";
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
    headerPlugins,
    {
        name: "forms-form-details-revision-content-preview",
        type: "forms-form-details-revision-content",
        render({ form, loading, refreshPages }: WithFormDetailsProps) {
            return (
                <Tab label={t`Form preview`} disabled={loading}>
                    <RenderBlock>
                        <Elevation z={2}>
                            <div style={{ position: "relative" }}>
                                {loading && <CircularProgress />}
                                <Header form={form} loading={loading} refreshPages={refreshPages} />
                                <FormPreview form={form} refreshPages={refreshPages} />;
                            </div>
                        </Elevation>
                    </RenderBlock>
                </Tab>
            );
        }
    }
]: Array<CmsPageDetailsPluginType>);
