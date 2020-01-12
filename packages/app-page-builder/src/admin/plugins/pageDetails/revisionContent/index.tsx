import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { PbPageDetailsRevisionContentPlugin } from "@webiny/app-page-builder/admin/types";
import { Tabs } from "@webiny/ui/Tabs";

const plugin: PbPageDetailsRevisionContentPlugin = {
    name: "pb-page-details-revision-content",
    type: "pb-page-details",
    render({ pageDetails, ...rest }) {
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
};

export default plugin;
