import { useSecurity } from "@webiny/app-security";
import { useCallback } from "react";
import { ReadonlyArticle } from "@demo/shared";

const getStorageKey = (...keys: string[]) => {
    return `CognitoIdentityServiceProvider.${
        process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    }.${keys.join(".")}`;
};

const getPreviewDomain = () => {
    if (window.location.origin.includes("localhost")) {
        return `http://localhost:3000`;
    }

    return `https://druexxzabmhs4.cloudfront.net`;
};

export function usePreviewUrl() {
    const { identity } = useSecurity();

    return useCallback((article: ReadonlyArticle) => {
        if (!identity) {
            return "";
        }

        const pathname = `/${article.region?.slug}-${article.language?.slug}${article.slug}`;
        const email = identity.profile!.email!;

        const idToken = localStorage.getItem(getStorageKey(email, "idToken"));
        const accessToken = localStorage.getItem(getStorageKey(email, "accessToken"));
        const refreshToken = localStorage.getItem(getStorageKey(email, "refreshToken"));
        const search = [
            `preview=true`,
            `idToken=${idToken}`,
            `accessToken=${accessToken}`,
            `refreshToken=${refreshToken}`
        ];

        return [getPreviewDomain(), pathname, `?${search.join("&")}`].join("");
    }, []);
}
