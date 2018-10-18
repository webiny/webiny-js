// @flow
import * as React from "react";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import PageActions from "./PageActions";

export default ({
    name: "cms-page-details-actions",
    type: "cms-page-details",
    render({ pageDetails }: WithPageDetailsProps) {
        return <PageActions pageDetails={pageDetails} />;
    }
}: CmsPageDetailsPluginType);
