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
import { PageRoute } from "./../components/Page";

export default [
    {
        name: "pb-route",
        type: "route",
        route: <Route component={PageRoute} />
    } as RoutePlugin,
    linkPreloadPlugin(),
    {
        type: "addon-render",
        name: "addon-render-site-head",
        component: (
            <Query
                query={gql`
                    query PbGetSettings {
                        pageBuilder {
                            getSettings {
                                data {
                                    name
                                    favicon {
                                        src
                                    }
                                    social {
                                        image {
                                            src
                                        }
                                    }
                                }
                            }
                        }
                    }
                `}
            >
                {({ data: response }) => {
                    const { favicon, name, social } =
                        get(response, "pageBuilder.getSettings.data") || {};

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

                                {name && (
                                    <>
                                        <meta name="title" content={name} />
                                        <meta property="og:title" content={name} />
                                    </>
                                )}

                                {social?.image?.src && (
                                    <meta property="og:image" content={social.image.src} />
                                )}
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
