import { IAddOptions, IZipper } from "./abstractions/Zipper";
import { IUpload } from "./abstractions/Upload";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import { IArchiver } from "./abstractions/Archiver";

export interface IZipperConfig {
    upload: IUpload;
    archiver: IArchiver;
}

export class Zipper implements IZipper {
    private readonly upload: IUpload;
    public readonly archiver: IArchiver;

    public constructor(config: IZipperConfig) {
        this.upload = config.upload;
        this.archiver = config.archiver;

        this.archiver.archiver.pipe(config.upload.stream);
    }

    public async add(data: Buffer, options: IAddOptions): Promise<void> {
        this.archiver.archiver.append(data, options);
    }

    public async finalize(): Promise<void> {
        setTimeout(() => {
            this.archiver.archiver.finalize();
        }, 200);
    }

    public async abort(): Promise<void> {
        return this.upload.abort();
    }

    public async done(): Promise<CompleteMultipartUploadCommandOutput> {
        return this.upload.done();
    }
}
