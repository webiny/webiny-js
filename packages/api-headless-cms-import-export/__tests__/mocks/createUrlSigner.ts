import { IUrlSigner } from "~/tasks/utils/urlSigner";

export const createUrlSigner = (): IUrlSigner => {
    return {
        async sign(params) {
            const timeout = params.timeout || 604800; // 1 week default
            return {
                url: `signed://${params.key}`,
                bucket: "bucket",
                key: params.key,
                expiresOn: new Date(new Date().getTime() + timeout)
            };
        }
    };
};
