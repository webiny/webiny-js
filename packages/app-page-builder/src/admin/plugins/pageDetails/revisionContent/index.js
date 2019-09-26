// @flow
import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import type { PbPageDetailsPluginType, WithPageDetailsProps } from "@webiny/app-page-builder/types";
import { Tabs } from "@webiny/ui/Tabs";

export default ({
    name: "pb-page-details-revision-content",
    type: "pb-page-details",
    render({ pageDetails, ...rest }: WithPageDetailsProps) {
        return (
            <Tabs>
                {renderPlugins(
                    "pb-page-details-revision-content",
                    { pageDetails, ...rest },
                    { wrapper: false }
                )}
            </Tabs>
        );
    }
}: PbPageDetailsPluginType);
