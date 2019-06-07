// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";
import type { CmsPageDetailsPluginType, WithFormDetailsProps } from "webiny-app-forms/types";
import { Tab } from "webiny-ui/Tabs";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";
import FormPreview from "./FormPreview";
import { CircularProgress } from "webiny-ui/Progress";

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
        name: "forms-form-details-revision-content-preview",
        type: "forms-form-details-revision-content",
        render({ form, loading, refreshPages }: WithFormDetailsProps) {
            return (
                <Tab label={"Page preview"} disabled={loading}>
                    <RenderBlock>
                        <Elevation z={2}>
                            <div style={{ position: "relative" }}>
                                {loading && <CircularProgress />}
                                {renderPlugins("forms-form-details-revision-content-preview", {
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
        type: "forms-form-details-revision-content-preview",
        render({ form }: WithFormDetailsProps) {
            return <FormPreview form={form} />;
        }
    }
]: Array<CmsPageDetailsPluginType>);
