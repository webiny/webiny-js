import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { PbPageDetailsPlugin } from "@webiny/app-page-builder/types";
import { Tabs } from "@webiny/ui/Tabs";

const plugin: PbPageDetailsPlugin = {
    name: "cms-content-details-revision-content",
    type: "cms-content-details",
    render(props) {
        return (
            <Tabs>
                {renderPlugins("cms-content-details-revision-content", props, { wrapper: false })}
            </Tabs>
        );
    }
};

export default plugin;
