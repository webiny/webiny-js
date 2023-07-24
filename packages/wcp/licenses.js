const fetch = require("node-fetch");
const { decrypt } = require("./encryption");
const { getWcpApiUrl } = require("./urls");

const fetchWcpProjectLicense = async ({ orgId, projectId, projectEnvironmentApiKey }) => {
    // Fetch and decrypt the license.
    const getLicenseEndpoint = getWcpApiUrl(`/orgs/${orgId}/projects/${projectId}/license`);

    const encryptedLicense = await fetch(getLicenseEndpoint, {
        headers: { authorization: projectEnvironmentApiKey }
    })
        .then(response => response.json())
        .catch(e => {
            console.warn(
                `An error occurred while trying to retrieve the license for project "${orgId}/${projectId}": ${e.message}`
            );
            return null;
        });

    return encryptedLicense;
};

const getWcpProjectLicense = async params => {
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
        return decrypt(encryptedLicense);
    } catch (e) {
        const projectId = `${params.orgId}/${params.projectId}`;
        console.warn(
            `An error occurred while trying to decrypt the retrieved license for project "${projectId}": ${e.message}`
        );
        return null;
    }
};

module.exports = { getWcpProjectLicense };
