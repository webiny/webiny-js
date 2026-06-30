import pReduce from "p-reduce";
import { Plugin } from "@webiny/plugins";
import { createAbstraction } from "@webiny/feature/api";
import type { FileToSign } from "~/utils/FileNormalizer.js";

interface Setter<T> {
    (param: T): T;
}

class FileUploadModifierBuilder {
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
        setFile: FileUploadModifierBuilder["setFile"];
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

/**
 * DI multiple-abstraction for file-upload modifiers. Replaces the old
 * `context.plugins.byType(FileUploadModifierPlugin.type)` lookup in createFileNormalizerFromContext.
 * Extensions register modifiers via `container.registerInstance(FileUploadModifier, createFileUploadModifier(cb))`.
 */
export const FileUploadModifier = createAbstraction<FileUploadModifierPlugin>("FileUploadModifier");

export interface FileModifier {
    (file: FileToSign): Promise<Partial<FileToSign>> | Partial<FileToSign>;
}

export const createModifierFromPlugins = (
    plugins: FileUploadModifierPlugin[] = []
): FileModifier => {
    const modifier = new FileUploadModifierBuilder();
    plugins.forEach(pl => pl.execute({ modifier }));

    return (file: FileToSign) => modifier.execute(file);
};
