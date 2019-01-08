// @flow
import { compose, withHandlers, mapProps } from "recompose";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
import getPagePreviewUrl from "./withCmsSettings/getPagePreviewUrl";
import { get } from "lodash";

export default () =>
    compose(
        graphql(
            gql`
                {
                    settings {
                        cms {
                            domain
                        }
                    }
                }
            `,
            {
                name: "cmsSettings"
            }
        ),
        withHandlers({
            getPagePreviewUrl: ({ cmsSettings }) => (page: Object) => {
                const domain = get(cmsSettings, "settings.cms.domain");
                return getPagePreviewUrl({ page, domain });
            }
        }),
        mapProps(({ getPagePreviewUrl, cmsSettings, ...rest }) => {
            return {
                ...rest,
                cmsSettings: {
                    data: get(cmsSettings, "settings.cms"),
                    getPagePreviewUrl
                }
            };
        })
    );
