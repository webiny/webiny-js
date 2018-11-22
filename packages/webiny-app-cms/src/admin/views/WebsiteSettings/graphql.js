// @flow
import gql from "graphql-tag";
import getWebsiteSettingsGraphqlFields from "./getWebsiteSettingsGraphqlFields";

export const updateWebsiteSettings = () => gql`
            mutation updateWebsiteSettings($data: JSON!) {
                cms {
                    updateWebsiteSettings(data: $data) {
                        data {
                            ${getWebsiteSettingsGraphqlFields()}
                        }
                        error {
                            code
                            message
                            data
                        }
                    }
                }
            }
        `;

export const getWebsiteSettings = () => {
    return gql`
            query getWebsiteSettings {
                cms {
                    getWebsiteSettings {
                        data {
                            ${getWebsiteSettingsGraphqlFields()}
                        }
                        error {
                            code
                            message
                            data
                        }
                    }
                }
            }
        `;
};
