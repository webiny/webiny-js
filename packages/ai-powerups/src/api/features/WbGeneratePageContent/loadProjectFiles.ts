import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { compress, decompress } from "@webiny/utils/features/compression/legacy/gzip.js";
import type { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

interface AssetMetadata {
    id: string;
    tenant: string;
    size: number;
    contentType: string;
    bucketKey: string;
}

export interface ProjectFileContent {
    id: string;
    name: string;
    content: string;
}

interface ProjectFileRef {
    id: string;
    name: string;
    mimeType: string;
}

const SUPPORTED_MIME_PREFIXES = ["text/"];
const SUPPORTED_MIME_TYPES = new Set(["application/json", "application/csv"]);

const CACHE_TTL_DAYS = 30;

function isSupportedType(mimeType: string): boolean {
    if (SUPPORTED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))) {
        return true;
    }
    return SUPPORTED_MIME_TYPES.has(mimeType);
}

function cacheKey(projectId: string, version: number): string {
    return `project-context:${projectId}:v${version}`;
}

function cacheExpiresAt(): Date {
    const date = new Date();
    date.setDate(date.getDate() + CACHE_TTL_DAYS);
    return date;
}

interface CachedProjectContext {
    files: ProjectFileContent[];
}

export async function loadProjectFiles(
    projectId: string,
    version: number,
    files: ProjectFileRef[],
    excludedFileIds: string[] | null | undefined,
    keyValueStore: GlobalKeyValueStore.Interface
): Promise<ProjectFileContent[]> {
    if (files.length === 0) {
        return [];
    }

    const allFiles = await getOrAssembleProjectFiles(
        projectId,
        version,
        files,
        keyValueStore
    );

    if (excludedFileIds && excludedFileIds.length > 0) {
        const excluded = new Set(excludedFileIds);
        return allFiles.filter(f => !excluded.has(f.id));
    }

    return allFiles;
}

async function getOrAssembleProjectFiles(
    projectId: string,
    version: number,
    files: ProjectFileRef[],
    keyValueStore: GlobalKeyValueStore.Interface
): Promise<ProjectFileContent[]> {
    const key = cacheKey(projectId, version);

    const cached = await keyValueStore.get<string>(key);
    if (!cached.isFail() && cached.value) {
        try {
            const decompressed = await decompress(Buffer.from(cached.value, "base64"));
            const parsed = JSON.parse(decompressed.toString("utf-8")) as CachedProjectContext;
            return parsed.files;
        } catch {
            // Cache corrupted, fall through to assembly
        }
    }

    const assembled = await assembleFromS3(files, keyValueStore);

    try {
        const payload: CachedProjectContext = { files: assembled };
        const compressed = await compress(JSON.stringify(payload));
        await keyValueStore.set(key, compressed.toString("base64"), {
            expiresAt: cacheExpiresAt()
        });
    } catch {
        // Cache write failure is non-fatal
    }

    return assembled;
}

async function assembleFromS3(
    files: ProjectFileRef[],
    keyValueStore: GlobalKeyValueStore.Interface
): Promise<ProjectFileContent[]> {
    const supportedFiles = files.filter(f => isSupportedType(f.mimeType));

    if (supportedFiles.length === 0) {
        return [];
    }

    const s3 = new S3();
    const bucket = String(process.env.S3_BUCKET);

    const results = await Promise.all(
        supportedFiles.map(async (file): Promise<ProjectFileContent | null> => {
            const metadataResult = await keyValueStore.get<AssetMetadata>(
                `FileManager/File/${file.id}/Metadata`
            );

            if (metadataResult.isFail() || !metadataResult.value) {
                return null;
            }

            try {
                const s3Object = await s3.getObject({
                    Bucket: bucket,
                    Key: metadataResult.value.bucketKey
                });

                if (!s3Object.Body) {
                    return null;
                }

                const buffer = Buffer.from(await s3Object.Body.transformToByteArray());
                return {
                    id: file.id,
                    name: file.name,
                    content: buffer.toString("utf-8")
                };
            } catch {
                return null;
            }
        })
    );

    return results.filter((r): r is ProjectFileContent => r !== null);
}
