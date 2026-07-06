import type { DecryptedWcpProjectLicense, EncryptedWcpProjectLicense } from "./types.js";
import { decrypt } from "./encryption.js";
import { getWcpApiUrl } from "./urls.js";

interface GetWcpProjectLicenseParams {
    orgId: string;
    projectId: string;
    projectEnvironmentApiKey: string;
}

const fetchWcpProjectLicense = async ({
    orgId,
    projectId,
    projectEnvironmentApiKey
}: GetWcpProjectLicenseParams) => {
    // Fetch and decrypt the license.
    const getLicenseEndpoint = getWcpApiUrl(`/orgs/${orgId}/projects/${projectId}/license`);

    const encryptedLicense: { license: EncryptedWcpProjectLicense } | null = await fetch(
        getLicenseEndpoint,
        {
            headers: { authorization: projectEnvironmentApiKey }
        }
    )
        .then(response => {
            if (response.ok) {
                return response.json();
            }

            console.warn(
                `An error occurred while trying to retrieve the license for project "${orgId}/${projectId}": invalid response status (${response.status}, ${response.statusText})`,
                response
            );

            return null;
        })
        .catch(e => {
            console.warn(
                `An error occurred while trying to retrieve the license for project "${orgId}/${projectId}": ${e.message}`,
                e
            );
            return null;
        });

    return encryptedLicense;
};

export const getWcpProjectLicense = async (params: GetWcpProjectLicenseParams) => {
    let encryptedLicense = process.env.WCP_PROJECT_LICENSE;
    if (!encryptedLicense) {
        const fetchedLicense = await fetchWcpProjectLicense(params);
        if (fetchedLicense) {
            encryptedLicense = fetchedLicense.license;
        }
    }

    if (!encryptedLicense) {
        return null;
    }

    // The license may arrive already decrypted: the AWS flavour bakes a base64 `WCP_PROJECT_LICENSE`
    // at build (needs decrypt), but the self-hosted/server flavour fetches at runtime and the API can
    // return the license as a plain object or plaintext JSON string. Accept all three forms.
    if (typeof encryptedLicense === "object") {
        return encryptedLicense as DecryptedWcpProjectLicense;
    }

    try {
        return decrypt<DecryptedWcpProjectLicense>(encryptedLicense);
    } catch {
        // Not base64-encoded — maybe it's already a plaintext JSON string.
        try {
            return JSON.parse(encryptedLicense) as DecryptedWcpProjectLicense;
        } catch (e) {
            const projectId = `${params.orgId}/${params.projectId}`;
            console.warn(
                `An error occurred while trying to read the retrieved license for project "${projectId}": ${
                    (e as Error).message
                }`
            );
            return null;
        }
    }
};
