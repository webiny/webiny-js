import * as React from "react";
import { Route } from "@webiny/react-router";
import renderPlugins from "@webiny/app-page-builder/render/presets/default";
import { RoutePlugin } from "@webiny/app/types";
import { PbAddonRenderPlugin } from "@webiny/app-page-builder/types";
import Helmet from "react-helmet";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import linkPreloadPlugin from "./linkPreload";
import Page from "./../components/Page";

export default [
    {
        name: "pb-route",
        type: "route",
        route: <Route component={Page} />
    } as RoutePlugin,
    linkPreloadPlugin(),
    {
        type: "addon-render",
        name: "addon-render-favicon",
        component: (
            <Query
                query={gql`
                    query PbGetFavicon {
                        pageBuilder {
                            getSettings {
                                data {
                                    favicon {
                                        src
                                    }
                                }
                            }
                        }
                    }
                `}
            >
                {({ data: response }) => {
                    const { favicon } = get(response, "pageBuilder.getSettings.data") || {};

                    // Manually added "?width=128" to the favicon URL. In the future, fix this.
                    // See "packages/webiny-app/src/plugins/imagePlugin.js:54"
                    if (favicon && favicon.src) {
                        return (
                            <Helmet>
                                <link
                                    rel="icon"
                                    type="image/png"
                                    href={favicon.src + "?width=128"}
                                    sizes="16x16"
                                />
                            </Helmet>
                        );
                    }

                    return null;
                }}
            </Query>
        )
    } as PbAddonRenderPlugin,
    ...renderPlugins
];
