/**
 * Hex SHA-256 of a request body, for the `x-amz-content-sha256` header.
 *
 * Required whenever a streaming route is reached through CloudFront with Origin Access Control. OAC
 * signs the request with SigV4 but does NOT hash the body itself — it folds whatever this header says
 * into the signature, and the Lambda Function URL's IAM authorizer then recomputes the hash from the
 * body it received. Omit the header and the two disagree, so a POST WITH a body is rejected with
 * `InvalidSignatureException` while a bodyless POST succeeds, because an empty payload hashes
 * predictably.
 *
 * `crypto.subtle` needs a secure context, which the streaming behavior already requires
 * (`viewerProtocolPolicy: "https-only"`).
 */
export async function toPayloadHash(body: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));

    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}
