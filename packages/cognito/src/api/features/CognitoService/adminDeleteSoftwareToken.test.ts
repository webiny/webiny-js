import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminDeleteSoftwareToken } from "./adminDeleteSoftwareToken.js";

const params = {
    region: "eu-central-1",
    userPoolId: "eu-central-1_pool",
    username: "user-1",
    credentials: async () => ({
        accessKeyId: "AKIDEXAMPLE",
        secretAccessKey: "secret",
        sessionToken: "session-token"
    })
};

describe("adminDeleteSoftwareToken", () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers({ now: new Date("2026-11-07T10:00:00Z"), toFake: ["Date"] });
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("sends a signed AdminDeleteSoftwareToken request to the pool's region", async () => {
        fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

        await adminDeleteSoftwareToken(params);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("https://cognito-idp.eu-central-1.amazonaws.com/");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual({
            UserPoolId: "eu-central-1_pool",
            Username: "user-1"
        });

        const headers = init.headers as Record<string, string>;
        expect(headers["x-amz-target"]).toBe(
            "AWSCognitoIdentityProviderService.AdminDeleteSoftwareToken"
        );
        expect(headers["content-type"]).toBe("application/x-amz-json-1.1");
        expect(headers["x-amz-date"]).toBe("20261107T100000Z");
        expect(headers["x-amz-security-token"]).toBe("session-token");
        expect(headers["authorization"]).toMatch(
            /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20261107\/eu-central-1\/cognito-idp\/aws4_request, SignedHeaders=[^,]*x-amz-target[^,]*, Signature=[0-9a-f]{64}$/
        );
    });

    it("throws Cognito's error with the exception's name and message", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    __type: "com.amazonaws.cognito#UserNotFoundException",
                    message: "User does not exist."
                }),
                { status: 400 }
            )
        );

        const error = await adminDeleteSoftwareToken(params).catch(e => e);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("UserNotFoundException");
        expect(error.message).toBe("User does not exist.");
    });

    it("treats a user without a TOTP token as done", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    __type: "ResourceNotFoundException",
                    message: "Software token MFA has not been configured for this user."
                }),
                { status: 400 }
            )
        );

        await expect(adminDeleteSoftwareToken(params)).resolves.toBeUndefined();
    });

    it("still throws other ResourceNotFoundException errors", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    __type: "ResourceNotFoundException",
                    message: "User pool eu-central-1_pool does not exist."
                }),
                { status: 400 }
            )
        );

        const error = await adminDeleteSoftwareToken(params).catch(e => e);

        expect(error.name).toBe("ResourceNotFoundException");
        expect(error.message).toBe("User pool eu-central-1_pool does not exist.");
    });

    it("keeps the raw text when Cognito's error isn't JSON", async () => {
        fetchMock.mockResolvedValue(new Response("Service Unavailable", { status: 503 }));

        const error = await adminDeleteSoftwareToken(params).catch(e => e);

        expect(error.name).toBe("HTTP503");
        expect(error.message).toBe("Service Unavailable");
    });
});
