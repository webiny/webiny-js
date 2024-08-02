import {
    IMultipartUploadHandlerAddResult,
    IMultipartUploadHandlerPauseResult
} from "../abstractions/MultipartUploadHandler";

export interface IMultipartUploadHandlerAddResultParams {
    written: boolean;
    nextPart: number;
    pause: () => Promise<IMultipartUploadHandlerPauseResult>;
}

export class MultipartUploadHandlerAddResult implements IMultipartUploadHandlerAddResult {
    public readonly nextPart: number;
    private readonly written: boolean;
    private readonly _pause: () => Promise<IMultipartUploadHandlerPauseResult>;

    public constructor(params: IMultipartUploadHandlerAddResultParams) {
        this.written = params.written;
        this.nextPart = params.nextPart;
        this._pause = params.pause;
    }

    public canBePaused(): boolean {
        return this.written;
    }
    public async pause(): Promise<IMultipartUploadHandlerPauseResult> {
        return this._pause();
    }
}

export const createMultipartUploadHandlerAddResult = (
    params: IMultipartUploadHandlerAddResultParams
): IMultipartUploadHandlerAddResult => {
    return new MultipartUploadHandlerAddResult(params);
};
