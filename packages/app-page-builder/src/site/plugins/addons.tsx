import * as React from "react";
import { Query } from "react-apollo";
import Helmet from "react-helmet";
import gql from "graphql-tag";
import { get } from "lodash";
import { PbAddonRenderPlugin } from "@webiny/app-page-builder/types";

export default (): PbAddonRenderPlugin => ({
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

                            {name && <meta name="title" content={name} />}
                            {name && <meta property="og:title" content={name} />}

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
});
