import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createUploadToken } from "~/utils/uploadToken.js";
import type { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { IHttpRequest } from "@webiny/event-handler-core";

export const SECRET = "test-upload-secret";
export const TENANT_ID = "t1";

export const tenant = {
    id: TENANT_ID,
    name: "Test",
    description: "",
    status: "enabled" as const,
    isInstalled: true,
    settings: {},
    tags: [],
    parent: null,
    createdOn: "2026-01-01T00:00:00Z",
    savedOn: "2026-01-01T00:00:00Z"
};

export const makeTenantContext = (): TenantContext.Interface => ({
    getTenant: () => tenant,
    setTenant: () => {},
    withRootTenant: async (cb: () => any) => cb(),
    withEachTenant: async (_tenants: any[], cb: (t: any) => any) => [await cb(tenant)],
    withTenant: async (_t: any, cb: (t: any) => any) => cb(tenant)
});

export const buildMultipartBody = (
    fields: Record<string, string>,
    file: { name: string; filename: string; data: Buffer }
): { body: Buffer; boundary: string } => {
    const boundary = "----TestBoundary123";
    const parts: Buffer[] = [];

    for (const [name, value] of Object.entries(fields)) {
        parts.push(
            Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
            )
        );
    }

    const fileHeader = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`
    );
    parts.push(Buffer.concat([fileHeader, file.data, Buffer.from("\r\n")]));
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    return { body: Buffer.concat(parts), boundary };
};

export const makeUploadRequest = (params: {
    storageKey: string;
    fileContent: Buffer;
    filename: string;
    tokenOverrides?: Partial<Parameters<typeof createUploadToken>[0]>;
}): IHttpRequest => {
    const token = createUploadToken(
        {
            key: params.storageKey,
            tenantId: TENANT_ID,
            expiresAt: Date.now() + 60_000,
            uploadMinFileSize: 0,
            uploadMaxFileSize: 1_099_511_627_776,
            ...params.tokenOverrides
        },
        SECRET
    );

    const { body, boundary } = buildMultipartBody(
        { key: params.storageKey, token },
        { name: "file", filename: params.filename, data: params.fileContent }
    );

    return {
        method: "POST",
        path: "/webiny-file-upload",
        headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
        query: {},
        pathParameters: {},
        body
    };
};

let storagePath = "";

export const setupStorage = async (): Promise<string> => {
    storagePath = await fs.mkdtemp(path.join(os.tmpdir(), "webiny-fm-test-"));
    process.env.WEBINY_LOCAL_STORAGE_PATH = storagePath;
    process.env.WEBINY_UPLOAD_SECRET = SECRET;
    return storagePath;
};

export const cleanupStorage = async (): Promise<void> => {
    await fs.rm(storagePath, { recursive: true, force: true });
    delete process.env.WEBINY_LOCAL_STORAGE_PATH;
    delete process.env.WEBINY_UPLOAD_SECRET;
};

export const getStoragePath = (): string => storagePath;

export const writeTestFile = async (relativePath: string, content: Buffer): Promise<string> => {
    const filePath = path.join(storagePath, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    return filePath;
};
