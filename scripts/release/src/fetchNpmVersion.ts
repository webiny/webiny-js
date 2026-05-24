import pRetry from "p-retry";
import execa from "execa";

export async function fetchNpmDistTags(): Promise<Record<string, string>> {
    const { stdout: npmRegistry } = await execa("npm", ["config", "get", "registry"]);
    const registryUrl = npmRegistry.replace(/\/$/, "");

    const getDistTags = async () => {
        const res = await fetch(`${registryUrl}/@webiny/cli`);
        const json = await res.json();
        return json["dist-tags"] as Record<string, string>;
    };

    return pRetry(getDistTags, { retries: 5 });
}
