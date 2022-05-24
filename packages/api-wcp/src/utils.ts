import { WcpProjectEnvironment } from "@webiny/wcp/types";
import { decrypt } from "@webiny/wcp";

process.env.WCP_API_URL = "https://d16nfk35w3a3cu.cloudfront.net";
process.env.WCP_APP_URL = "http://localhost:3000";
process.env.WCP_PROJECT_ENVIRONMENT =
    "eyJpZCI6ImRldiN1d2hsMGZpemZlIiwiYXBpS2V5IjoiNWQxNTU3NjYtNDUzYi00ZjRhLTg2MWMtMTNlM2RmNTFkODEzIiwib3JnIjp7ImlkIjoiYm9yZyJ9LCJwcm9qZWN0Ijp7ImlkIjoiYXdlc29tZS1wcm9qZWN0In19";

export function getWcpProjectEnvironment(): WcpProjectEnvironment | null {
    if (process.env.WCP_PROJECT_ENVIRONMENT) {
        try {
            return JSON.parse(
                decrypt(process.env.WCP_PROJECT_ENVIRONMENT)
            ) as WcpProjectEnvironment;
        } catch {
            throw new Error("Could not decrypt WCP_PROJECT_ENVIRONMENT environment variable data.");
        }
    }
    return null;
}

export const geWcpProjectLicenseCacheKey = () => {
    // We're dividing an hour into 5-minute blocks. In an hour, that's 12 blocks total.
    // So, while we're in the same 5-minute block, the cached license will be returned.
    // Once we exit it, the license will again be fetched from the WCP API.
    // This way of caching / invalidating the cache ensures all active AWS Lambda function
    // instances flush their cache and fetch the license at the same time.
    const currentHourOfTheDay = new Date().getHours();
    const currentMinuteOfTheHour = new Date().getMinutes();

    // Example returned values:
    // - "cached-license-16-2"
    // - "cached-license-0-1"
    // - "cached-license-23-12"
    return `cached-project-license-${currentHourOfTheDay}-${Math.ceil(currentMinuteOfTheHour / 5)}`;
};
