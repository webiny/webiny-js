// @flow
import { compose, withHandlers, mapProps } from "recompose";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
import getPagePreviewUrl from "./withPageBuilderSettings/getPagePreviewUrl";
import { get } from "lodash";

const domainQuery = gql`
    {
        pageBuilder {
            getSettings {
                data {
                    domain
                }
            }
        }
    }
`;

export default () =>
    compose(
        graphql(domainQuery, { name: "pageBuilderSettings" }),
        withHandlers({
            getPagePreviewUrl: ({ pageBuilderSettings }) => (page: Object) => {
                const domain = get(pageBuilderSettings, "pageBuilder.getSettings.data.domain");
                return getPagePreviewUrl({ page, domain });
            }
        }),
        mapProps(({ getPagePreviewUrl, pageBuilderSettings, ...rest }) => {
            return {
                ...rest,
                pageBuilderSettings: {
                    data: get(pageBuilderSettings, "pageBuilder.getSettings.data"),
                    getPagePreviewUrl
                }
            };
        })
    );
