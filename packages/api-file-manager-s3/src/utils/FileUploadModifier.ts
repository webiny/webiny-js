import pReduce from "p-reduce";
import { Plugin } from "@webiny/plugins";
import { FileToSign } from "~/utils/FileNormalizer";

interface Setter<T> {
    (param: T): T;
}

class FileUploadModifier {
    private fileSetters: Setter<FileToSign>[] = [];

    setFile(setter: Setter<FileToSign>): void {
        this.fileSetters.push(setter);
    }

    execute(file: FileToSign) {
        return pReduce(
            this.fileSetters,
            async (file, setter) => {
                // We need to spread the original file, then add (potentially) partial changes.
                return { ...file, ...(await setter(file)) };
            },
            file
        );
    }
}

interface FileUploadModifierCallbackParams {
    modifier: {
        setFile: FileUploadModifier["setFile"];
    };
}

export class FileUploadModifierPlugin extends Plugin {
    public static override type = "fm.s3.uploadModifier";
    private readonly cb: FileUploadModifierCallable;

    constructor(cb: FileUploadModifierCallable) {
        super();
        this.cb = cb;
    }

    execute(params: FileUploadModifierCallbackParams) {
        return this.cb(params);
    }
}

interface FileUploadModifierCallable {
    (params: FileUploadModifierCallbackParams): void;
}

export const createFileUploadModifier = (cb: FileUploadModifierCallable) => {
    return new FileUploadModifierPlugin(cb);
};

export interface FileModifier {
    (file: FileToSign): Promise<Partial<FileToSign>> | Partial<FileToSign>;
}

export const createModifierFromPlugins = (
    plugins: FileUploadModifierPlugin[] = []
): FileModifier => {
    const modifier = new FileUploadModifier();
    plugins.forEach(pl => pl.execute({ modifier }));

    return (file: FileToSign) => modifier.execute(file);
};
