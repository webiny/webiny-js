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

    try {
        return decrypt<DecryptedWcpProjectLicense>(encryptedLicense);
    } catch (e) {
        const projectId = `${params.orgId}/${params.projectId}`;
        console.warn(
            `An error occurred while trying to decrypt the retrieved license for project "${projectId}": ${e.message}`
        );
        return null;
    }
};
