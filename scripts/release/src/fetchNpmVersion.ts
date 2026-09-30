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

/**
 * Every published version of "@webiny/cli". Dist-tags only point at the newest release under
 * each tag, so this is what tells a release which prerelease numbers are taken.
 */
export async function fetchNpmVersions(): Promise<string[]> {
    const { stdout: npmRegistry } = await execa("npm", ["config", "get", "registry"]);
    const registryUrl = npmRegistry.replace(/\/$/, "");

    const getVersions = async () => {
        // The abbreviated document still has "versions", without the full manifest of each one.
        const res = await fetch(`${registryUrl}/@webiny/cli`, {
            headers: { accept: "application/vnd.npm.install-v1+json" }
        });
        const json = await res.json();
        return Object.keys(json.versions || {});
    };

    return pRetry(getVersions, { retries: 5 });
}
