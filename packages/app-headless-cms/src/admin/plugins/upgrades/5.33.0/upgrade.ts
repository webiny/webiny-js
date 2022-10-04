import { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import { CmsErrorResponse } from "~/types";
import { I18NLocaleItem } from "@webiny/app-i18n/types";

interface UpgradeMutationResponse {
    cms: {
        upgrade: {
            data: boolean | null;
            error?: CmsErrorResponse;
        };
    };
}
interface UpgradeMutationVariables {
    version: string;
}
const UPGRADE_MUTATION = gql`
    mutation UpgradeCMS($version: String!) {
        cms {
            upgrade(version: $version) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

interface UpgradeParams {
    locales?: I18NLocaleItem[] | null;
    client: ApolloClient<any>;
}
export const runUpgrade = async (params: UpgradeParams): Promise<void> => {
    const { locales, client } = params;
    if (!locales || locales.length === 0) {
        throw new Error(
            `There are no locales to be upgraded. Please check the log and report this to the Webiny team.`
        );
    }

    const response = await client.mutate<UpgradeMutationResponse, UpgradeMutationVariables>({
        mutation: UPGRADE_MUTATION,
        variables: {
            version: "5.33.0"
        },
        fetchPolicy: "no-cache"
    });

    if (!response.data) {
        throw new Error(
            "Missing response when trying to upgrade the system. Please contact the Webiny team."
        );
    }
    const error = response.data.cms.upgrade.error;
    if (error) {
        throw new Error(error.message);
    }
};
