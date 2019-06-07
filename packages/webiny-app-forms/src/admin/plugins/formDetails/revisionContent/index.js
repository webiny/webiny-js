// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";
import type { CmsPageDetailsPluginType, WithFormDetailsProps } from "webiny-app-forms/types";
import { Tabs } from "webiny-ui/Tabs";

export default ({
    name: "forms-form-details-revision-content",
    type: "forms-form-details",
    render(props: WithFormDetailsProps) {
        return (
            <Tabs>
                {renderPlugins(
                    "forms-form-details-revision-content",
                    props,
                    { wrapper: false }
                )}
            </Tabs>
        );
    }
}: CmsPageDetailsPluginType);
