import type { GenericRecord } from "@webiny/api/types";
import { generateAlphaNumericId } from "@webiny/utils";

interface IImageData {
    id: string;
    url: string;
    size: number;
    aliases: string[];
    key: string;
    name: string;
    type: string;
    extensions: GenericRecord;
    location: {
        folderId: string;
    };
    meta: GenericRecord;
    tags: string[];
}

interface IImageConfig {
    url: string;
    size?: number;
    aliases?: string[];
    tags?: string[];
}

class ImageData {
    public readonly data: IImageData;

    public get id(): string {
        return this.data.id;
    }

    public get url(): string {
        return this.data.url;
    }

    public get size(): number {
        return this.data.size;
    }

    public get aliases(): string[] {
        return this.data.aliases;
    }

    public get key(): string {
        return this.data.key;
    }

    public get name(): string {
        return this.data.name;
    }

    public get type(): string {
        return this.data.type;
    }

    public get extensions(): GenericRecord {
        return this.data.extensions;
    }

    public get location(): { folderId: string } {
        return this.data.location;
    }

    public get meta(): GenericRecord {
        return this.data.meta;
    }

    public get tags(): string[] {
        return this.data.tags;
    }

    public constructor(config: IImageConfig) {
        const url = new URL(config.url);
        const { pathname } = url;
        this.data = {
            id: generateAlphaNumericId(),
            url: config.url,
            size: config.size || 100,
            aliases: config.aliases || [],
            key: pathname,
            type: "image/jpeg",
            tags: config.tags || [],
            name: pathname.split("/").pop() as string,
            extensions: {},
            location: {
                folderId: "root"
            },
            meta: {}
        };
    }
}

export const createImages = (): ImageData[] => {
    return [
        new ImageData({
            url: "https://aCloundfrontDistributionId.cloudfront.net/files/fileId1234/image-1-in-its-own-directory.jpg",
            aliases: ["alias-image-1-in-its-own-directory.jpg"]
        }),
        new ImageData({
            url: "https://aCloundfrontDistributionId.cloudfront.net/files/fileId2345/image-2-in-its-own-directory.jpg"
        }),
        new ImageData({
            url: "https://aCloundfrontDistributionId.cloudfront.net/files/image-3-no-directory.jpg",
            aliases: ["alias-image-3-no-directory.jpg"]
        }),
        new ImageData({
            url: "https://aCloundfrontDistributionId.cloudfront.net/files/fileId4567/image-4-in-its-own-directory.jpg",
            aliases: ["alias-image-4-in-its-own-directory.jpg"]
        }),
        new ImageData({
            url: "https://aCloundfrontDistributionId.cloudfront.net/files/image-5-no-directory.jpg"
        }),
        new ImageData({
            url: "https://aCloundfrontDistributionId.cloudfront.net/files/fileId6789/image-6-in-its-own-directory.jpg",
            aliases: ["alias-image-6-in-its-own-directory.jpg"]
        })
    ];
};
