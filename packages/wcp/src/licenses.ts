import fetch from "node-fetch";
import { DecryptedWcpProjectLicense, EncryptedWcpProjectLicense } from "./types";
import { decrypt } from "./encryption";
import { getWcpApiUrl } from "./urls";

export const getWcpProjectLicense = async ({
    orgId,
    projectId,
    projectEnvironmentApiKey: apiKey
}: {
    orgId: string;
    projectId: string;
    projectEnvironmentApiKey: string;
}) => {
    // Fetch and decrypt the license
    const getLicenseEndpoint = getWcpApiUrl(`/orgs/${orgId}/projects/${projectId}/license`);

    const encryptedLicense: { license: EncryptedWcpProjectLicense } | null = await fetch(
        getLicenseEndpoint,
        {
            headers: { authorization: apiKey }
        }
    )
        .then(response => response.json())
        .catch(e => {
            console.error(
                `An error occurred while trying to retrieve the license for project "${orgId}/${projectId}": ${e.message}`
            );
            return null;
        });

    if (!encryptedLicense) {
        return null;
    }

    try {
        // For now, when we say "decrypt", we're basically just base64-decoding the received string.
        const decryptedLicense = decrypt(encryptedLicense.license);
        return JSON.parse(decryptedLicense) as DecryptedWcpProjectLicense;
    } catch (e) {
        console.error(
            `An error occurred while trying to decrypt the retrieved license for project "${orgId}/${projectId}": ${e.message}`
        );
        return null;
    }
};
