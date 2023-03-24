import { getApiUrl } from "./getApiUrl";

export const getGqlApiUrl = () => {
    return getApiUrl("/graphql");
};
