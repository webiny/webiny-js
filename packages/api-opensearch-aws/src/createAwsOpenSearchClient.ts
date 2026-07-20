import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import {
    createOpenSearchClient,
    type OpenSearchClientOptions,
    type Client
} from "@webiny/api-opensearch";
import WebinyError from "@webiny/error";

export const createAwsOpenSearchClient = (options: OpenSearchClientOptions): Client => {
    if (options.auth) {
        return createOpenSearchClient(options);
    }

    const region = process.env.AWS_REGION;
    if (!region) {
        throw new WebinyError("Missing AWS_REGION environment variable.", "MISSING_AWS_REGION");
    }

    return createOpenSearchClient({
        ...options,
        ...AwsSigv4Signer({
            region,
            service: "es",
            getCredentials: () => {
                const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
                const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
                const sessionToken = process.env.AWS_SESSION_TOKEN;

                if (!accessKeyId || !secretAccessKey) {
                    throw new WebinyError(
                        "Missing AWS credentials (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY).",
                        "MISSING_AWS_CREDENTIALS"
                    );
                }

                return Promise.resolve({ accessKeyId, secretAccessKey, sessionToken });
            }
        })
    });
};
