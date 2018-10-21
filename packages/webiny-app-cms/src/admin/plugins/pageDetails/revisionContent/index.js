// @flow
import * as React from "react";
import { Plugins } from "webiny-app/components";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tabs } from "webiny-ui/Tabs";

export default ({
    name: "cms-page-details-revision-content",
    type: "cms-page-details",
    render({ pageDetails }: WithPageDetailsProps) {
        return (
            <Tabs>
                <Plugins type={"cms-page-details-revision-content"} params={{ pageDetails }} />
            </Tabs>
        );
    }
}: CmsPageDetailsPluginType);
