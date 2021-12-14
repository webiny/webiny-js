import { GraphQLClient } from "graphql-request";
import { Logger } from "~/types";
import { CmsGroup, CmsGroupCreateInput } from "~/applications/headlessCms/graphql/types";
import { createInsertGroupMutation } from "~/applications/headlessCms/graphql";
import { chance } from "~/utils/chance";
import lodashCamelCase from "lodash/camelCase";

export interface Params {
    client: GraphQLClient;
    name?: string;
    log: Logger;
}
export const createGroup = async (params: Params): Promise<CmsGroup | null> => {
    const { client, name: initialName, log } = params;
    const mutation = createInsertGroupMutation();

    const name = initialName || chance().profession();
    const icon = "fas/star";

    const data: CmsGroupCreateInput = {
        name,
        description: `${name} - ${icon}`,
        icon,
        slug: lodashCamelCase(name).toLowerCase()
    };

    let response;
    try {
        response = await client.request(mutation, {
            data
        });
    } catch (ex) {
        log.red(ex.message);
        return null;
    }
    if (!response || !response.data) {
        log.red(`Could not create new group. Missing response.`);
        return null;
    }

    const { data: group, error } = response?.data?.createContentModelGroup || {};
    if (!group) {
        log.red(error?.message);
        log.red(`Could not create new group. Missing data.contentModelGroup response.`);
        return null;
    }
    return group;
};
