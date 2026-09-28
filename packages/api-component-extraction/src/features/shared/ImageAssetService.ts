import { createAbstraction } from "@webiny/feature/api";
import { createS3, PutObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CreateFilesInBatchUseCase } from "@webiny/api-file-manager/features/file/CreateFilesInBatch/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { FileUrlGenerator } from "@webiny/api-file-manager/features/file/FileUrlGenerator/index.js";
import type { MigrateImagesDeps } from "~/features/stages/capture/migrateImages.js";

/**
 * The File Manager and key-value plumbing behind image migration, kept behind one abstraction so
 * `migrateImages` stays a decision function with no infrastructure in it.
 */
export interface IImageAssetService {
    /**
     * Load what the service needs before it can produce urls. Call once before `deps`.
     *
     * `FileUrlGenerator` reads the File Manager's `srcPrefix` in `init()` and prefixes nothing until
     * it has — so a url generated before that is a bare storage key rather than an address. The
     * File Manager's own GraphQL schema calls `init()` on every request; anything using the generator
     * outside that path has to do it itself, and silently gets keys if it does not.
     */
    prepare(): Promise<void>;
    /** The dependency bundle `migrateImages` takes, minus the logger the caller supplies. */
    deps(log: (message: string) => Promise<void>): MigrateImagesDeps;
}

export const ImageAssetService = createAbstraction<IImageAssetService>(
    "ComponentExtraction/ImageAssetService"
);
export namespace ImageAssetService {
    export type Interface = IImageAssetService;
}

class ImageAssetServiceImpl implements IImageAssetService {
    private prepared = false;

    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private tenantContext: TenantContext.Interface,
        private createFiles: CreateFilesInBatchUseCase.Interface,
        private getFile: GetFileUseCase.Interface,
        private fileUrlGenerator: FileUrlGenerator.Interface
    ) {}

    async prepare(): Promise<void> {
        if (this.prepared) {
            return;
        }
        // `init` is optional on the abstraction: an implementation that needs no prefix omits it.
        await this.fileUrlGenerator.init?.();
        this.prepared = true;
    }

    deps(log: (message: string) => Promise<void>): MigrateImagesDeps {
        return {
            store: {
                get: async <T>(key: string) => {
                    const result = await this.keyValueStore.get<T>(key);
                    if (result.isFail()) {
                        // An absent key is the normal "not migrated yet" state, not a failure.
                        if (result.error.code === "KeyValueStore/KeyNotFound") {
                            return { value: null };
                        }
                        throw new Error(result.error.message);
                    }
                    return { value: result.value ?? null };
                },
                set: async (key, value) => {
                    const result = await this.keyValueStore.set(key, value);
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                }
            },

            uploadBatch: async files => {
                const tenant = this.tenantContext.getTenant().id;
                const s3 = createS3();

                /*
                 * Bytes to S3 first, records second. A record pointing at an object that is not there
                 * yet is a broken image; an object with no record is invisible and collectable.
                 */
                await Promise.all(
                    files.map(file =>
                        s3.send(
                            new PutObjectCommand({
                                Bucket: String(process.env.S3_BUCKET),
                                Key: `tenants/${tenant}/files/${file.key}`,
                                Body: Buffer.from(file.bytes),
                                ContentType: file.contentType
                            })
                        )
                    )
                );

                const created = await this.createFiles.execute({
                    files: files.map(file => ({
                        id: file.id,
                        key: file.key,
                        size: file.bytes.byteLength,
                        type: file.contentType,
                        name: file.name,
                        /*
                         * Enrichment off. Each created image otherwise triggers a background task to
                         * describe and tag it, which at a portfolio's scale is the dominant cost of
                         * this feature — and these are migrated assets, already described by the page
                         * they came from.
                         */
                        metadata: { aiImageEnrichment: false },
                        tags: []
                    }))
                });

                if (created.isFail()) {
                    throw new Error(created.error.message);
                }

                return created.value.map(file => ({ id: file.id, key: file.key }));
            },

            fileExists: async fileId => {
                const result = await this.getFile.execute(fileId);
                return result.isOk();
            },

            urlOf: fileKey => this.fileUrlGenerator.generateUrl({ key: fileKey } as never),

            log
        };
    }
}

export const ImageAssetServiceImplementation = ImageAssetService.createImplementation({
    implementation: ImageAssetServiceImpl,
    dependencies: [
        KeyValueStore,
        TenantContext,
        CreateFilesInBatchUseCase,
        GetFileUseCase,
        FileUrlGenerator
    ]
});
