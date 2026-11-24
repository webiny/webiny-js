import { FileMimeType } from "./FileMimeType.js";

export interface StoreFileInputOptions {
    name: string;
    /** MIME type. Resolved from the name's extension when not set. */
    type?: string;
    /** A stable ID, so storing the same file twice fails with `alreadyExists` instead of creating a duplicate. */
    id?: string;
    /** Defaults to `"root"`. */
    folderId?: string;
    tags?: string[];
    description?: string;
    metadata?: Record<string, any>;
}

const ROOT_FOLDER_ID = "root";

/**
 * Input for `StoreFileUseCase`: a file's bytes and the attributes of its record.
 *
 * Mutable: build it with `fromBuffer` / `fromString`, then change it with the `set*` methods, which
 * return `this`. The size always comes from the bytes. It doesn't validate anything: the use case
 * checks the size, the key and permissions and returns a `Result` error.
 */
export class StoreFileInput {
    private contents: Buffer;
    private name: string;
    private type: string | undefined = undefined;
    private id: string | undefined = undefined;
    private folderId = ROOT_FOLDER_ID;
    private tags: string[] = [];
    private description = "";
    private metadata: Record<string, any> = {};

    private constructor(contents: Buffer, name: string) {
        this.contents = contents;
        this.name = name;
    }

    static fromBuffer(buffer: Buffer | Uint8Array, options: StoreFileInputOptions): StoreFileInput {
        const input = new StoreFileInput(StoreFileInput.toBuffer(buffer), options.name);
        return input.applyOptions(options);
    }

    static fromString(text: string, options: StoreFileInputOptions): StoreFileInput {
        return StoreFileInput.fromBuffer(Buffer.from(text, "utf8"), options);
    }

    setContents(buffer: Buffer | Uint8Array): this {
        this.contents = StoreFileInput.toBuffer(buffer);
        return this;
    }

    setName(name: string): this {
        this.name = name;
        return this;
    }

    setType(type: string | undefined): this {
        this.type = type || undefined;
        return this;
    }

    setId(id: string | undefined): this {
        this.id = id || undefined;
        return this;
    }

    setFolder(folderId: string | undefined): this {
        this.folderId = folderId || ROOT_FOLDER_ID;
        return this;
    }

    setTags(tags: string[]): this {
        this.tags = [];
        for (const tag of tags) {
            this.addTag(tag);
        }
        return this;
    }

    addTag(tag: string): this {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
        return this;
    }

    setDescription(description: string): this {
        this.description = description;
        return this;
    }

    setMetadata(metadata: Record<string, any>): this {
        this.metadata = { ...metadata };
        return this;
    }

    getContents(): Buffer {
        return this.contents;
    }

    getSize(): number {
        return this.contents.byteLength;
    }

    getName(): string {
        return this.name;
    }

    getType(): string {
        const mimeType = this.type
            ? FileMimeType.from(this.type)
            : FileMimeType.fromName(this.name);
        return mimeType.toString();
    }

    getId(): string | undefined {
        return this.id;
    }

    getFolderId(): string {
        return this.folderId;
    }

    getTags(): string[] {
        return [...this.tags];
    }

    getDescription(): string {
        return this.description;
    }

    getMetadata(): Record<string, any> {
        return { ...this.metadata };
    }

    private applyOptions(options: StoreFileInputOptions): this {
        this.setType(options.type).setId(options.id).setFolder(options.folderId);
        if (options.tags) {
            this.setTags(options.tags);
        }
        if (options.description !== undefined) {
            this.setDescription(options.description);
        }
        if (options.metadata) {
            this.setMetadata(options.metadata);
        }
        return this;
    }

    private static toBuffer(buffer: Buffer | Uint8Array): Buffer {
        if (Buffer.isBuffer(buffer)) {
            return buffer;
        }
        return Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }
}
