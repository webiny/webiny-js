import { getApiUrl } from "./getApiUrl";

export const getGqlApiUrl = (): string => {
    return getApiUrl("/graphql");
};
