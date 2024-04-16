const USER_POOL_CLIENT_ID = "6uiftnlbolh3hevrqeu6sdftld";

export const decodePayload = (jwtToken: string) => {
    const payload = jwtToken.split(".")[1];
    try {
        return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    } catch (err) {
        return {};
    }
};

export const calculateClockDrift = (iatAccessToken: number, iatIdToken: number) => {
    const now = Math.floor(Date.now() / 1000);
    const iat = Math.min(iatAccessToken, iatIdToken);
    return now - iat;
};

const getStorageKey = (...keys: string[]) => {
    return `CognitoIdentityServiceProvider.${USER_POOL_CLIENT_ID}.${keys.join(".")}`;
};

export function useCredentialsFromUrl() {
    const url = new URL(window.location.href);
    const idToken = url.searchParams.get("idToken");
    const accessToken = url.searchParams.get("accessToken");
    const refreshToken = url.searchParams.get("refreshToken");

    if (idToken) {
        const idTokenData = decodePayload(idToken);
        const username = idTokenData["cognito:username"];

        localStorage.setItem(getStorageKey("LastAuthUser"), username);
        localStorage.setItem(getStorageKey(username, "idToken"), idToken);

        if (refreshToken) {
            localStorage.setItem(getStorageKey(username, "refreshToken"), refreshToken);
        }

        if (accessToken) {
            const accessTokenData = decodePayload(accessToken);

            localStorage.setItem(getStorageKey(username, "accessToken"), accessToken);
            localStorage.setItem(
                getStorageKey(username, "clockDrift"),
                calculateClockDrift(accessTokenData["iat"], idTokenData["iat"]).toString()
            );
        }
    }
}
