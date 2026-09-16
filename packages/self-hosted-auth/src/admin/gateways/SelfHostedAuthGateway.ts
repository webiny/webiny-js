import { createAbstraction } from "@webiny/feature/admin";
import { createFeature } from "@webiny/feature/admin";

const LOGIN_MUTATION = /* GraphQL */ `
    mutation SelfHostedAuthLogin($email: String!, $password: String!) {
        selfHostedAuthLogin(email: $email, password: $password) {
            data {
                token
                expiresIn
            }
            error {
                code
                message
            }
        }
    }
`;

const REQUEST_RESET_MUTATION = /* GraphQL */ `
    mutation SelfHostedAuthRequestPasswordReset($email: String!) {
        selfHostedAuthRequestPasswordReset(email: $email) {
            data
            error {
                code
                message
            }
        }
    }
`;

const RESET_MUTATION = /* GraphQL */ `
    mutation SelfHostedAuthResetPassword($email: String!, $code: String!, $password: String!) {
        selfHostedAuthResetPassword(email: $email, code: $code, password: $password) {
            data
            error {
                code
                message
            }
        }
    }
`;

export interface GatewayError {
    code: string;
    message: string;
}

/** What every one of these mutations returns: the payload, or the error the API chose to name. */
export interface GatewayResult<TData> {
    data: TData | null;
    error: GatewayError | null;
}

export interface IssuedToken {
    token: string;
    expiresIn: number;
}

export interface ISelfHostedAuthGateway {
    signIn(params: { email: string; password: string }): Promise<GatewayResult<IssuedToken>>;

    requestResetCode(params: { email: string }): Promise<GatewayResult<boolean>>;

    resetPassword(params: {
        email: string;
        code: string;
        password: string;
    }): Promise<GatewayResult<boolean>>;
}

/**
 * The three calls the login screen makes, and the only place in the admin half of this package that
 * talks to the network.
 *
 * It sends the requests itself rather than going through `MainGraphQLClient`, which is the one way
 * it differs from gateways elsewhere. The screen renders before anyone is authenticated, and the
 * endpoint comes from the admin's own `resolveGraphqlUrl()` so that a relative API URL (what the dev
 * proxy bakes in) resolves the same way here as in the rest of the app.
 */
export const SelfHostedAuthGateway =
    createAbstraction<ISelfHostedAuthGateway>("SelfHostedAuthGateway");

export namespace SelfHostedAuthGateway {
    export type Interface = ISelfHostedAuthGateway;
    export type Result<TData> = GatewayResult<TData>;
    export type Error = GatewayError;
    export type Token = IssuedToken;
}

export interface SelfHostedAuthGatewayConfig {
    graphqlUrl: string;
}

class FetchSelfHostedAuthGateway implements ISelfHostedAuthGateway {
    constructor(private config: SelfHostedAuthGatewayConfig) {}

    async signIn(params: { email: string; password: string }) {
        return this.mutate<IssuedToken>(LOGIN_MUTATION, params);
    }

    async requestResetCode(params: { email: string }) {
        return this.mutate<boolean>(REQUEST_RESET_MUTATION, params);
    }

    async resetPassword(params: { email: string; code: string; password: string }) {
        return this.mutate<boolean>(RESET_MUTATION, params);
    }

    private async mutate<TData>(
        query: string,
        variables: Record<string, unknown>
    ): Promise<GatewayResult<TData>> {
        const response = await fetch(this.config.graphqlUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ query, variables })
        });

        const body = await response.json();

        if (body?.errors?.length) {
            throw new Error(body.errors[0].message);
        }

        // One mutation per document, so whatever field came back is the one that was asked for.
        const payloads: GatewayResult<TData>[] = Object.values(body?.data ?? {});
        const payload = payloads[0];

        if (!payload) {
            throw new Error("The API returned an unexpected response.");
        }

        return payload;
    }
}

export const SelfHostedAuthGatewayFeature = createFeature<void, [SelfHostedAuthGatewayConfig]>({
    name: "SelfHostedAuthGateway",
    register(container, config) {
        container.registerInstance(SelfHostedAuthGateway, new FetchSelfHostedAuthGateway(config));
    }
});
