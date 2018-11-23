// @flow
import gql from "graphql-tag";
import getSystemSettingsGraphqlFields from "./getSystemSettingsGraphqlFields";

export const updateSystemSettings = () => gql`
            mutation updateSystemSettings($data: JSON!) {
                cms {
                    updateSystemSettings(data: $data) {
                        data {
                            ${getSystemSettingsGraphqlFields()}
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

export const getSystemSettings = () => {
    return gql`
            query getSystemSettings {
                cms {
                    getSystemSettings {
                        data {
                            ${getSystemSettingsGraphqlFields()}
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
