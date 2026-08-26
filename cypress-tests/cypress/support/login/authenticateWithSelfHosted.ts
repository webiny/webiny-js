import type { User } from "./index";

/**
 * Authenticate against the self-hosted ("server" hosting type) identity provider.
 *
 * The counterpart to `authenticateWithCognito`. Self-hosted exposes a deliberately unauthenticated
 * `selfHostedAuthLogin` mutation - it is how an identity is obtained in the first place - which
 * exchanges an email/password pair for a signed JWT.
 */
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

// Where the Admin app reads its token from. Seeding it is what makes the BROWSER session
// authenticated - unlike Cognito, whose SDK writes its own `CognitoIdentityServiceProvider.*` keys
// as a side effect of authenticating, this provider expects the login screen to have stored it.
export const SELF_HOSTED_AUTH_TOKEN_KEY = "webiny_self_hosted_auth_token";

export default async ({
    username,
    password
}: {
    username: string;
    password: string;
}): Promise<User> => {
    const response = await fetch(Cypress.env("GRAPHQL_API_URL"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            query: LOGIN_MUTATION,
            variables: { email: username, password }
        })
    });

    if (!response.ok) {
        throw new Error(
            `Self-hosted login request failed with HTTP ${response.status} ${response.statusText}.`
        );
    }

    const body = await response.json();

    if (body.errors?.length) {
        throw new Error(`Self-hosted login failed: ${body.errors[0].message}`);
    }

    const result = body.data?.selfHostedAuthLogin;

    if (result?.error) {
        throw new Error(
            `Self-hosted login failed: ${result.error.message} (${result.error.code}).`
        );
    }

    const token = result?.data?.token;

    if (!token) {
        throw new Error("Self-hosted login returned no token.");
    }

    window.localStorage.setItem(SELF_HOSTED_AUTH_TOKEN_KEY, token);

    // Same shape the Cognito helper returns, so callers keep using `user.idToken.jwtToken`.
    return { idToken: { jwtToken: token } };
};
