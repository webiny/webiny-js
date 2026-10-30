import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import jwt from "jsonwebtoken";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { OidcIdentityProvider } from "@webiny/api-core/idp/index.js";
import { CognitoApiFeature } from "@webiny/cognito/api/CognitoApiFeature.js";
import { getTestOpenSearchClient } from "@webiny/api-opensearch/testing/index.js";
import { createAwsDdbOsApiHandler } from "~/createWebinyApiHandler.js";

/**
 * The Cognito identity provider is registered by the `<Cognito/>` extension (CognitoApiFeature), in
 * the request container, and only there: the handler doesn't register one in the root. The request
 * auth step resolves identity providers from the request container after extensions have registered,
 * so it reaches the extension's provider.
 */
const COGNITO_ISSUER = `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;

const issuersSeenByAuth: string[] = [];

/**
 * Records every token issuer the auth step asks a provider about. Answers "not applicable", so the
 * provider never fetches signing keys from AWS.
 */
class IssuerProbe implements OidcIdentityProvider.Interface {
    public readonly issuer: string;
    public readonly clientId: string;

    public constructor(decoratee: OidcIdentityProvider.Interface) {
        this.issuer = decoratee.issuer;
        this.clientId = decoratee.clientId;
    }

    public isApplicable(token: OidcIdentityProvider.JwtPayload): boolean {
        const issuer = String(token.iss);
        issuersSeenByAuth.push(issuer);
        return false;
    }

    public getIdentity(): Promise<OidcIdentityProvider.IdentityData> {
        throw new Error("Not applicable to any token.");
    }
}

const IssuerProbeDecorator = OidcIdentityProvider.createDecorator({
    decorator: IssuerProbe,
    dependencies: []
});

// Mirrors what `<Cognito/>` generates into `extensions.ts`.
const cognito = createRegisterExtensionPlugin(({ container }) => {
    CognitoApiFeature.register(container);
});

const sendRequest = async (extensions: unknown[], token?: string) => {
    const documentClient = getDocumentClient();
    const openSearchClient = getTestOpenSearchClient();
    const handler = createAwsDdbOsApiHandler({
        extensions: () => extensions,
        documentClient,
        openSearchClient
    });

    const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-tenant": "root"
    };
    if (token) {
        headers["authorization"] = `Bearer ${token}`;
    }

    const body = JSON.stringify({ query: "{ __typename }" });
    return handler({
        httpMethod: "POST",
        path: "/graphql",
        headers,
        requestContext: { requestId: "test-req-cognito-idp" },
        body,
        isBase64Encoded: false
    });
};

describe("api-event-handler-aws-ddb-os — Cognito identity provider", () => {
    it("has exactly one Cognito identity provider per request with <Cognito/>", async () => {
        const providers: OidcIdentityProvider.Interface[] = [];
        const probe = createRegisterExtensionPlugin(({ container }) => {
            const resolved = container.resolveAll(OidcIdentityProvider);
            providers.push(...resolved);
        });

        await sendRequest([cognito, probe]);

        expect(providers).toHaveLength(1);
        expect(providers[0].issuer).toBe(COGNITO_ISSUER);
    });

    it("has no Cognito identity provider without <Cognito/>", async () => {
        const providers: OidcIdentityProvider.Interface[] = [];
        const probe = createRegisterExtensionPlugin(({ container }) => {
            const resolved = container.resolveAll(OidcIdentityProvider);
            providers.push(...resolved);
        });

        await sendRequest([probe]);

        expect(providers).toHaveLength(0);
    });

    it("authenticates requests against the provider <Cognito/> registers", async () => {
        issuersSeenByAuth.length = 0;
        const probe = createRegisterExtensionPlugin(({ container }) => {
            container.registerDecorator(IssuerProbeDecorator);
        });
        const token = jwt.sign({ iss: COGNITO_ISSUER, sub: "cognito-user" }, "not-verified");

        await sendRequest([cognito, probe], token);

        expect(issuersSeenByAuth).toEqual([COGNITO_ISSUER]);
    });
});
