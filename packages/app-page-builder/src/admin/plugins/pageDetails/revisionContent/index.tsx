import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { PbPageDetailsPlugin } from "../../../../types";
import { Tabs } from "@webiny/ui/Tabs";

export default new PbPageDetailsPlugin({
    name: "pb-page-details-revision-content",
    render(props) {
        return (
            <Tabs>
                {renderPlugins("pb-page-details-revision-content", props, {
                    wrapper: false
                })}
            </Tabs>
        );
    }
});
