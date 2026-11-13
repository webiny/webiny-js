import { createHash, createHmac } from "node:crypto";
import type { Hash as HashInterface } from "@smithy/types";
import type { AwsCredentialIdentity, Provider, SourceData } from "@smithy/types";
import { SignatureV4 } from "@smithy/signature-v4";

/**
 * Calls Cognito's `AdminDeleteSoftwareToken` as a signed HTTP request.
 *
 * Function bundles leave `@aws-sdk/*` out (`createRsbuildConfig.js`), so the API Lambda uses the
 * AWS SDK built into the Lambda runtime, and that SDK doesn't have `AdminDeleteSoftwareTokenCommand`
 * yet. `@smithy/*` is bundled, so this works on any runtime. Switch to the SDK command once the
 * Lambda runtime has it.
 */
export interface AdminDeleteSoftwareTokenParams {
    region: string;
    userPoolId: string;
    username: string;
    credentials: AwsCredentialIdentity | Provider<AwsCredentialIdentity>;
}

const SERVICE = "cognito-idp";
const TARGET = "AWSCognitoIdentityProviderService.AdminDeleteSoftwareToken";

export const adminDeleteSoftwareToken = async (
    params: AdminDeleteSoftwareTokenParams
): Promise<void> => {
    const hostname = `${SERVICE}.${params.region}.amazonaws.com`;

    const signer = new SignatureV4({
        service: SERVICE,
        region: params.region,
        credentials: params.credentials,
        sha256: Sha256
    });

    const request = await signer.sign({
        method: "POST",
        protocol: "https:",
        hostname,
        path: "/",
        query: {},
        headers: {
            host: hostname,
            "content-type": "application/x-amz-json-1.1",
            "x-amz-target": TARGET
        },
        body: JSON.stringify({ UserPoolId: params.userPoolId, Username: params.username })
    });

    const response = await fetch(`https://${hostname}/`, {
        method: "POST",
        headers: request.headers,
        body: request.body
    });

    if (response.ok) {
        return;
    }

    const error = await toCognitoError(response);
    if (isNoSoftwareTokenError(error)) {
        // The user never set up TOTP, so there's no token to delete. That's already the state a
        // delete leads to: they set up TOTP on their next sign-in.
        return;
    }
    throw error;
};

/**
 * Cognito's answer for a user without a TOTP token:
 * `ResourceNotFoundException: Software token MFA has not been configured for this user.`
 * The name alone also covers a missing user pool, so the message must match too.
 */
const isNoSoftwareTokenError = (error: Error): boolean => {
    return (
        error.name === "ResourceNotFoundException" &&
        /software token mfa has not been configured/i.test(error.message)
    );
};

/**
 * Cognito answers a failed call with `{ "__type": "...#UserNotFoundException", "message": "..." }`.
 * The error gets the exception's name, as the SDK would give it.
 */
const toCognitoError = async (response: Response): Promise<Error> => {
    const text = await response.text();

    let body: { __type?: string; message?: string; Message?: string } = {};
    try {
        body = JSON.parse(text);
    } catch {
        // Not JSON: keep the raw text as the message.
    }

    const type = (body.__type ?? "").split("#").pop() || `HTTP${response.status}`;
    const error = new Error(body.message ?? body.Message ?? (text || response.statusText));
    error.name = type;
    return error;
};

const toBuffer = (data: SourceData): Buffer => {
    if (typeof data === "string") {
        return Buffer.from(data, "utf8");
    }
    if (ArrayBuffer.isView(data)) {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }
    return Buffer.from(data);
};

/**
 * SHA-256 (or HMAC-SHA-256 with a secret) for the signer, on Node's own crypto.
 */
class Sha256 implements HashInterface {
    private readonly hash;

    constructor(secret?: SourceData) {
        this.hash = secret ? createHmac("sha256", toBuffer(secret)) : createHash("sha256");
    }

    update(data: SourceData): void {
        this.hash.update(toBuffer(data));
    }

    async digest(): Promise<Uint8Array> {
        return new Uint8Array(this.hash.digest());
    }
}
