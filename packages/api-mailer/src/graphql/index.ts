import { createSettingsGraphQL } from "~/graphql/settings";

export const createGraphQL = () => {
    return [createSettingsGraphQL()];
};
