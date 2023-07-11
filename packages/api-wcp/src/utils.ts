import { WcpProjectEnvironment } from "@webiny/wcp/types";
import { decrypt } from "@webiny/wcp";
import fetch from "node-fetch";
import { WcpFetchParams } from "~/createWcp";

export function getWcpProjectEnvironment(): WcpProjectEnvironment | null {
    if (process.env.WCP_PROJECT_ENVIRONMENT) {
        try {
            return decrypt<WcpProjectEnvironment>(process.env.WCP_PROJECT_ENVIRONMENT);
        } catch {
            throw new Error("Could not decrypt WCP_PROJECT_ENVIRONMENT environment variable data.");
        }
    }
    return null;
}

export const getWcpProjectLicenseCacheKey = () => {
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

export const wcpFetch = async ({ url, authorization, body }: WcpFetchParams) => {
    const response = await fetch(url, {
        method: "POST",
        headers: { authorization },
        body: JSON.stringify(body)
    });

    const { status, statusText } = response;
    if (response.ok) {
        return {
            error: false,
            status,
            statusText,
            message: ""
        };
    }

    try {
        const json = await response.json();
        return { error: true, status, statusText, message: json.message };
    } catch (e) {
        return { error: true, status, statusText, message: "" };
    }
};
