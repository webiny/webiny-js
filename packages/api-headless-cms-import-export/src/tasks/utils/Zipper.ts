import { IAddOptions, IZipper } from "./abstractions/Zipper";
import { Archiver } from "archiver";
import { IUpload } from "./abstractions/Upload";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";

export interface IZipperParams {
    upload: IUpload;
    archiver: Archiver;
}

export class Zipper implements IZipper {
    private readonly upload: IUpload;
    public readonly archiver: Archiver;

    public constructor(params: IZipperParams) {
        this.upload = params.upload;
        this.archiver = params.archiver;

        this.archiver.pipe(params.upload.stream);
    }

    public async add(data: Buffer, options: IAddOptions): Promise<void> {
        this.archiver.append(data, options);
    }

    public async finalize(): Promise<void> {
        setTimeout(() => {
            this.archiver.finalize();
        }, 200);
    }

    public async done(): Promise<CompleteMultipartUploadCommandOutput> {
        return this.upload.done();
    }
}
