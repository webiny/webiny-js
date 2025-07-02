import type { S3Client } from "@webiny/aws-sdk/client-s3";

export const createMockS3Client = (fn?: CallableFunction): Pick<S3Client, "send"> => {
    return {
        send: async input => {
            if (fn) {
                return fn(input);
            }
            return {} as any;
        }
    };
};
