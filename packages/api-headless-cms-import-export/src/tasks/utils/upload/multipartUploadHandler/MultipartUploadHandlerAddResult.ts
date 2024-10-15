import type {
    IMultipartUploadHandlerAddResult,
    IMultipartUploadHandlerPauseResult,
    IPart
} from "../abstractions/MultipartUploadHandler";

export interface IMultipartUploadHandlerAddResultParams {
    written: boolean;
    parts: IPart[];
    pause: () => Promise<IMultipartUploadHandlerPauseResult>;
}

export class MultipartUploadHandlerAddResult implements IMultipartUploadHandlerAddResult {
    public readonly parts: IPart[];
    private readonly written: boolean;
    private readonly _pause: () => Promise<IMultipartUploadHandlerPauseResult>;

    public constructor(params: IMultipartUploadHandlerAddResultParams) {
        this.written = params.written;
        this.parts = params.parts;
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
