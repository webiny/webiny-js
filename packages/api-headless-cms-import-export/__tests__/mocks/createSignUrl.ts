import { ISignUrl } from "~/tasks/utils/abstractions/SignedUrl";

export const createSignUrl = (): ISignUrl => {
    return {
        async fetch(params) {
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
