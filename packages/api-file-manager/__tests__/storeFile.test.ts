import { describe, expect, it } from "vitest";
import { mdbid } from "@webiny/utils";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/kernel-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import useGqlHandler from "~tests/utils/useGqlHandler";
import type { HandlerParams } from "~tests/utils/useGqlHandler";
import { StoreFileInput, StoreFileUseCase } from "~/exports/api/file-manager/file.js";
import type { StoreFileInputOptions } from "~/exports/api/file-manager/file.js";
import { CreateFileUseCase } from "~/features/file/CreateFile/abstractions.js";
import { FileContentsStorage } from "~/features/file/FileContentsStorage/index.js";
import { GetFileContentsByKeyUseCase } from "~/features/file/GetFileContentsByKey/index.js";
import {
    FileAlreadyExistsError,
    FileNotFoundError,
    FilePersistenceError
} from "~/domain/file/errors.js";
import {
    createFileUploadModifier,
    FileUploadModifier
} from "~/features/upload/utils/FileUploadModifier.js";

/**
 * An in-memory File Manager storage: what an S3 bucket or the standalone disk is in production.
 */
const createStorage = () => {
    const objects = new Map<string, { contents: Buffer; contentType: string }>();

    const register = (container: Container) => {
        class InMemoryFileContentsStorage implements FileContentsStorage.Interface {
            constructor(private tenantContext: TenantContext.Interface) {}

            async put(input: FileContentsStorage.PutInput) {
                const objectKey = this.toObjectKey(input.key);
                if (objects.has(objectKey)) {
                    return Result.fail(new FileAlreadyExistsError({ key: input.key }));
                }
                objects.set(objectKey, {
                    contents: Buffer.from(input.contents),
                    contentType: input.contentType
                });
                return Result.ok();
            }

            async delete(key: string) {
                objects.delete(this.toObjectKey(key));
                return Result.ok();
            }

            private toObjectKey(key: string) {
                return `tenants/${this.tenantContext.getTenant().id}/files/${key}`;
            }
        }

        class InMemoryGetFileContentsByKey implements GetFileContentsByKeyUseCase.Interface {
            constructor(private tenantContext: TenantContext.Interface) {}

            async execute(key: string) {
                const tenant = this.tenantContext.getTenant();
                const object = objects.get(`tenants/${tenant.id}/files/${key}`);
                if (!object) {
                    return Result.fail(new FileNotFoundError(key));
                }
                return Result.ok({ buffer: object.contents, contentType: object.contentType });
            }
        }

        container.register(
            FileContentsStorage.createImplementation({
                implementation: InMemoryFileContentsStorage,
                dependencies: [TenantContext]
            })
        );
        container.register(
            GetFileContentsByKeyUseCase.createImplementation({
                implementation: InMemoryGetFileContentsByKey,
                dependencies: [TenantContext]
            })
        );
    };

    return { objects, register };
};

interface StoreRequest {
    text: string;
    options: StoreFileInputOptions;
    /** Changes the input and its bytes right after the call starts, before it settles. */
    mutateAfterStart?: boolean;
}

/**
 * A route that runs the use cases the way an extension's server code would.
 */
const registerTestRoutes = (container: Container) => {
    class StoreFileRoute implements HttpRouteHandler.Interface {
        constructor(private storeFile: StoreFileUseCase.Interface) {}

        async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
            const body = request.body as StoreRequest;
            const input = StoreFileInput.fromString(body.text, body.options);
            const pending = this.storeFile.execute(input);
            if (body.mutateAfterStart) {
                input.getContents().fill("x".charCodeAt(0));
                input.setName("changed.png").setFolder("other-folder").setTags(["changed"]);
                const report = input.getMetadata().report;
                if (report) {
                    report.title = "changed";
                }
            }
            const result = await pending;
            if (result.isFail()) {
                return response.json({ error: { code: result.error.code } });
            }
            return response.json({ data: result.value });
        }
    }

    class ReadFileRoute implements HttpRouteHandler.Interface {
        constructor(private getContents: GetFileContentsByKeyUseCase.Interface) {}

        async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
            const { key } = request.body as { key: string };
            const result = await this.getContents.execute(key);
            if (result.isFail()) {
                return response.json({ error: { code: result.error.code } });
            }
            return response.json({
                data: { text: result.value.buffer.toString("utf8"), type: result.value.contentType }
            });
        }
    }

    const StoreFileRouteHandler = HttpRouteHandler.createImplementation({
        implementation: StoreFileRoute,
        dependencies: [StoreFileUseCase]
    });

    const ReadFileRouteHandler = HttpRouteHandler.createImplementation({
        implementation: ReadFileRoute,
        dependencies: [GetFileContentsByKeyUseCase]
    });

    class StoreFileRouteDefinition implements HttpRouteDefinition.Interface {
        readonly name = "test-store-file";
        readonly method = "POST";
        readonly path = "/test/store-file";
        readonly handler = StoreFileRouteHandler;
    }

    class ReadFileRouteDefinition implements HttpRouteDefinition.Interface {
        readonly name = "test-read-file";
        readonly method = "POST";
        readonly path = "/test/read-file";
        readonly handler = ReadFileRouteHandler;
    }

    container.register(
        HttpRouteDefinition.createImplementation({
            implementation: StoreFileRouteDefinition,
            dependencies: []
        })
    );
    container.register(
        HttpRouteDefinition.createImplementation({
            implementation: ReadFileRouteDefinition,
            dependencies: []
        })
    );
};

const setup = (params: HandlerParams = {}) => {
    const storage = createStorage();
    const plugins = [storage.register, registerTestRoutes, ...(params.plugins || [])];
    const gql = useGqlHandler({ ...params, plugins });

    const post = async (path: string, body: Record<string, any>) => {
        const response = await gql.handler({
            method: "POST",
            path,
            headers: { "x-tenant": "root", "content-type": "application/json" },
            body
        });
        const parsed =
            typeof response.body === "string" ? JSON.parse(response.body) : response.body;
        return parsed as { data?: any; error?: { code: string } };
    };

    return {
        ...gql,
        objects: storage.objects,
        storeFile: (body: StoreRequest) => post("/test/store-file", body),
        readFile: (key: string) => post("/test/read-file", { key })
    };
};

describe("StoreFileUseCase", () => {
    it("should store the bytes, create the file record and return its URL", async () => {
        const { storeFile, readFile, getFile, updateSettings } = setup();
        await updateSettings({ data: { srcPrefix: "https://cdn.example.com/files/" } });

        const result = await storeFile({
            text: "Monthly report",
            options: {
                name: "report.txt",
                tags: ["generated"],
                description: "A generated report",
                metadata: { source: "reports-task" }
            }
        });

        expect(result.error).toBeUndefined();
        const { file, url } = result.data;
        expect(file).toMatchObject({
            name: "report.txt",
            type: "text/plain",
            size: Buffer.byteLength("Monthly report"),
            key: `${file.id}/report.txt`,
            tags: ["generated"],
            description: "A generated report",
            metadata: { source: "reports-task" },
            location: { folderId: "root" },
            createdBy: { id: "12345678" }
        });

        expect(url).toBe(`https://cdn.example.com/files/${file.key}`);

        const [getFileResponse] = await getFile({ id: file.id });
        expect(getFileResponse.data.fileManager.getFile).toMatchObject({
            data: { id: file.id, key: file.key, name: "report.txt", size: file.size },
            error: null
        });

        const contents = await readFile(file.key);
        expect(contents.data).toEqual({ text: "Monthly report", type: "text/plain" });
    });

    it("should use the given ID and folder", async () => {
        const { storeFile } = setup();
        const id = mdbid();

        const result = await storeFile({
            text: "{}",
            options: { name: "data.json", id, folderId: "folder-1" }
        });

        expect(result.data.file).toMatchObject({
            id,
            key: `${id}/data.json`,
            type: "application/json",
            location: { folderId: "folder-1" }
        });
    });

    it("should apply the registered upload modifiers to the key", async () => {
        const modifier = (container: Container) => {
            container.registerInstance(
                FileUploadModifier,
                createFileUploadModifier(({ modifier }) => {
                    modifier.setFile(file => ({ ...file, key: `generated-${file.name}` }));
                })
            );
        };
        const { storeFile, objects } = setup({ plugins: [modifier] });

        const result = await storeFile({ text: "hello", options: { name: "hello.txt" } });

        const { file } = result.data;
        expect(file.key).toBe(`${file.id}/generated-hello.txt`);
        expect(objects.has(`tenants/root/files/${file.id}/generated-hello.txt`)).toBe(true);
    });

    it("should reject a file outside the settings' size limits without writing it", async () => {
        const { storeFile, updateSettings, objects } = setup();
        await updateSettings({ data: { uploadMinFileSize: 2, uploadMaxFileSize: 10 } });

        const tooLarge = await storeFile({
            text: "more than ten bytes",
            options: { name: "a.txt" }
        });
        const tooSmall = await storeFile({ text: "a", options: { name: "b.txt" } });
        const withinLimits = await storeFile({ text: "ten bytes!", options: { name: "c.txt" } });

        expect(tooLarge.error).toEqual({ code: "FileManager/File/InvalidFileSizeError" });
        expect(tooSmall.error).toEqual({ code: "FileManager/File/InvalidFileSizeError" });
        expect(withinLimits.error).toBeUndefined();
        expect([...objects.keys()]).toEqual([`tenants/root/files/${withinLimits.data.file.key}`]);
    });

    it("should reject an identity that can't create files without writing anything", async () => {
        const { storeFile, objects } = setup({ permissions: [{ name: "fm.file", rwd: "r" }] });

        const result = await storeFile({ text: "hello", options: { name: "hello.txt" } });

        expect(result.error).toEqual({ code: "FileManager/File/NotAuthorizedError" });
        expect(objects.size).toBe(0);
    });

    it("should reject an invalid ID without writing anything", async () => {
        const { storeFile, objects } = setup();

        const result = await storeFile({ text: "hello", options: { name: "a.txt", id: ".." } });

        expect(result.error).toEqual({ code: "FileManager/File/InvalidFileKeyError" });
        expect(objects.size).toBe(0);
    });

    it("should reject an ID that already exists and keep the existing file's bytes", async () => {
        const { storeFile, readFile } = setup();
        const id = mdbid();

        const first = await storeFile({ text: "first", options: { name: "a.txt", id } });
        const second = await storeFile({ text: "second", options: { name: "a.txt", id } });

        expect(second.error).toEqual({ code: "FileManager/File/AlreadyExistsError" });
        const contents = await readFile(first.data.file.key);
        expect(contents.data.text).toBe("first");
    });

    it("should keep bytes another call already wrote under the same key", async () => {
        // Another call with the same ID won the race: its bytes are stored, its record isn't yet.
        const { storeFile, objects } = setup();
        const id = mdbid();
        const objectKey = `tenants/root/files/${id}/a.txt`;
        objects.set(objectKey, { contents: Buffer.from("first"), contentType: "text/plain" });

        const result = await storeFile({ text: "second", options: { name: "a.txt", id } });

        expect(result.error).toEqual({ code: "FileManager/File/AlreadyExistsError" });
        expect(objects.get(objectKey)?.contents.toString("utf8")).toBe("first");
    });

    it("should delete the written bytes when the file record can't be created", async () => {
        const failingCreate = (container: Container) => {
            class FailingCreateFile implements CreateFileUseCase.Interface {
                async execute() {
                    return Result.fail(new FilePersistenceError(new Error("Could not create.")));
                }
            }
            container.registerDecorator(
                CreateFileUseCase.createDecorator({
                    decorator: FailingCreateFile,
                    dependencies: []
                })
            );
        };
        const { storeFile, listFiles, objects } = setup({ plugins: [failingCreate] });

        const result = await storeFile({ text: "hello", options: { name: "hello.txt" } });

        expect(result.error).toEqual({ code: "FileManager/File/PersistenceError" });
        expect(objects.size).toBe(0);
        const [listResponse] = await listFiles();
        expect(listResponse.data.fileManager.listFiles.data).toEqual([]);
    });

    it("should keep the written bytes when the create fails after the record is stored", async () => {
        // What a throwing after-create subscriber does: the record is stored, the create fails.
        const failAfterCreate = (container: Container) => {
            class FailAfterCreateFile implements CreateFileUseCase.Interface {
                constructor(private decoratee: CreateFileUseCase.Interface) {}

                async execute(...args: Parameters<CreateFileUseCase.Interface["execute"]>) {
                    const result = await this.decoratee.execute(...args);
                    if (result.isFail()) {
                        return result;
                    }
                    return Result.fail(new FilePersistenceError(new Error("Subscriber failed.")));
                }
            }
            container.registerDecorator(
                CreateFileUseCase.createDecorator({
                    decorator: FailAfterCreateFile,
                    dependencies: []
                })
            );
        };
        const { storeFile, getFile, readFile } = setup({ plugins: [failAfterCreate] });
        const id = mdbid();

        const result = await storeFile({ text: "hello", options: { name: "hello.txt", id } });

        expect(result.error).toEqual({ code: "FileManager/File/PersistenceError" });
        const [getFileResponse] = await getFile({ id });
        expect(getFileResponse.data.fileManager.getFile.data).toMatchObject({
            key: `${id}/hello.txt`
        });
        const contents = await readFile(`${id}/hello.txt`);
        expect(contents.data.text).toBe("hello");
    });

    it("should store the input as it was when the call started", async () => {
        const { storeFile, readFile } = setup();

        const result = await storeFile({
            text: "original",
            options: {
                name: "report.txt",
                folderId: "folder-1",
                tags: ["first"],
                metadata: { report: { title: "original" } }
            },
            mutateAfterStart: true
        });

        expect(result.data.file).toMatchObject({
            name: "report.txt",
            type: "text/plain",
            location: { folderId: "folder-1" },
            tags: ["first"],
            metadata: { report: { title: "original" } }
        });
        const contents = await readFile(result.data.file.key);
        expect(contents.data.text).toBe("original");
    });
});
