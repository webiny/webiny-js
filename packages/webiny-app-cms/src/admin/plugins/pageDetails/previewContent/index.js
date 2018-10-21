// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import RenderElement from "webiny-app-cms/render/components/Element";

export default ([
    {
        name: "cms-page-details-revision-content-preview",
        type: "cms-page-details-revision-content",
        render({ pageDetails }: WithPageDetailsProps) {
            return (
                <Tab label={"Page preview"}>
                    {renderPlugins("cms-page-details-revision-content-preview", { pageDetails })}
                </Tab>
            );
        }
    },
    {
        name: "cms-page-details-revision-render",
        type: "cms-page-details-revision-content-preview",
        render({ pageDetails }: WithPageDetailsProps) {
            return <RenderElement element={pageDetails.revision.data.content} />;
        }
    }
]: Array<CmsPageDetailsPluginType>);
