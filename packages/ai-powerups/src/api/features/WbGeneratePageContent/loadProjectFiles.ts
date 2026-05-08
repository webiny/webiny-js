import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
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
const SUPPORTED_MIME_TYPES = new Set([
    "application/json",
    "application/csv"
]);

function isSupportedType(mimeType: string): boolean {
    if (SUPPORTED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))) {
        return true;
    }
    return SUPPORTED_MIME_TYPES.has(mimeType);
}

export async function loadProjectFiles(
    files: ProjectFileRef[],
    excludedFileIds: string[] | null | undefined,
    keyValueStore: GlobalKeyValueStore.Interface
): Promise<ProjectFileContent[]> {
    if (files.length === 0) {
        return [];
    }

    const excluded = new Set(excludedFileIds ?? []);
    const includedFiles = files.filter(f => !excluded.has(f.id) && isSupportedType(f.mimeType));

    if (includedFiles.length === 0) {
        return [];
    }

    const s3 = new S3();
    const bucket = String(process.env.S3_BUCKET);

    const results = await Promise.all(
        includedFiles.map(async (file): Promise<ProjectFileContent | null> => {
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
