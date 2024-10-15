import {
    IMultipartUploadHandler,
    IMultipartUploadHandlerAbortResult,
    IMultipartUploadHandlerAddResult,
    IMultipartUploadHandlerCompleteResult,
    IMultipartUploadHandlerGetBufferResult,
    ITag
} from "~/tasks/utils/upload";
import { NonEmptyArray } from "@webiny/api/types";

export const createMockMultipartUpload = async (
    params?: Partial<IMultipartUploadHandler>
): Promise<IMultipartUploadHandler> => {
    return {
        getUploadId(): string {
            return "mockUploadId";
        },
        async add(): Promise<IMultipartUploadHandlerAddResult> {
            return {} as any;
        },
        async complete(): Promise<IMultipartUploadHandlerCompleteResult> {
            return {} as any;
        },
        async abort(): Promise<IMultipartUploadHandlerAbortResult> {
            return {} as any;
        },
        getBuffer(): IMultipartUploadHandlerGetBufferResult {
            return {} as any;
        },
        getNextPart(): number {
            return 1;
        },
        getTags(): NonEmptyArray<ITag> {
            return ["tag1"];
        },
        ...params
    };
};
