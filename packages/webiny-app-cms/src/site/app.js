// @flow
import * as React from "react";
import { addPlugin } from "webiny-plugins";
import renderPlugins from "webiny-app-cms/render/presets/default";
import Page from "./components/Page";

export default () => {
    addPlugin(...renderPlugins);

    addPlugin({
        name: "cms-route",
        type: "route",
        route: {
            name: "Cms.Page",
            path: "*",
            render({ match }) {
                return <Page match={match} />;
            }
        }
    });
};
