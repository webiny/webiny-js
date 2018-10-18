// @flow
import * as React from "react";
import { getPlugins } from "webiny-app/plugins";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tabs } from "webiny-ui/Tabs";

const renderPlugins = (type, params: WithPageDetailsProps) => {
    return getPlugins(type).map(plugin => {
        const plContent = plugin.render(params);
        if (plContent) {
            return React.cloneElement(plContent, { key: plugin.name });
        }

        return null;
    });
};

export default ({
    name: "cms-page-details-revision-content",
    type: "cms-page-details",
    render({ pageDetails }: WithPageDetailsProps) {
        return <Tabs>{renderPlugins("cms-page-details-revision-content", { pageDetails })}</Tabs>;
    }
}: CmsPageDetailsPluginType);
