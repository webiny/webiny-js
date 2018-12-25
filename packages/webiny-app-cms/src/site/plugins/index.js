// @flow
import * as React from "react";
import renderPlugins from "webiny-app-cms/render/presets/default";
import Page from "./../components/Page";


export default [
    {
        name: "cms-route",
        type: "route",
        route: {
            name: "Cms.Page",
            path: "*",
            render({ match }) {
                return <Page match={match} />;
            }
        }
    },
    ...renderPlugins
]