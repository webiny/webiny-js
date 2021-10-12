import { LOGIN } from "./graphql";

/**
 * A factory
 */
export const createGetIdentityData =
    (mutation = LOGIN) =>
    async ({ client }) => {
        const response = await client.mutate({ mutation });
        const { data, error } = response.data.security.login;
        if (error) {
            throw new Error(error.message);
        }

        return data;
    };
