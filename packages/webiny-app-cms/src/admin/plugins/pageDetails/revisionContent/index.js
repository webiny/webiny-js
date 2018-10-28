// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tabs } from "webiny-ui/Tabs";

export default ({
    name: "cms-page-details-revision-content",
    type: "cms-page-details",
    render({ pageDetails }: WithPageDetailsProps) {
        return (
            <Tabs>
                {renderPlugins(
                    "cms-page-details-revision-content",
                    { pageDetails },
                    { wrapper: false }
                )}
            </Tabs>
        );
    }
}: CmsPageDetailsPluginType);
