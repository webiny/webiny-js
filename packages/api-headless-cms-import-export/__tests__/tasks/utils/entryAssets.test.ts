import { EntryAssets } from "~/tasks/utils/EntryAssets";
import { useHandler } from "~tests/helpers/useHandler";
import { CmsEntry } from "@webiny/api-headless-cms/types";
import { IAsset } from "./abstractions/EntryAssets";

const cloudfrontUrl = "https://aCloundfrontDistributionId.cloudfront.net";

const createImagePath = (file: string) => {
    return `/files/${file}`;
};

const createImageUrl = (file: string) => {
    return `${cloudfrontUrl}${createImagePath(file)}`;
};

describe("entry assets", () => {
    let entryAssets: EntryAssets;

    beforeEach(async () => {
        const { handler } = useHandler();
        const context = await handler();
        const traverser = await context.cms.getEntryTraverser("author");
        entryAssets = new EntryAssets({
            traverser
        });
    });

    it("should properly extract assets", async () => {
        expect(entryAssets).toBeInstanceOf(EntryAssets);

        const image1 = `fileId1234/image-1-in-its-own-directory.jpg`;
        const image2 = `fileId2345/image-2-in-its-own-directory.jpg`;
        const image3 = `image-3-no-directory.jpg`;
        const image4 = `fileId4567/image-4-in-its-own-directory.jpg`;
        const image5 = `image-5-no-directory.jpg`;
        const image6 = `fileId6789/image-6-in-its-own-directory.jpg`;

        const entry: Pick<CmsEntry, "values"> = {
            values: {
                fullName: "John Doe",
                image: createImageUrl(image1),
                images: [createImageUrl(image1), createImageUrl(image2), createImageUrl(image3)],
                wrapper: {
                    image: createImageUrl(image4),
                    images: [
                        createImageUrl(image3),
                        createImageUrl(image5),
                        createImageUrl(image6)
                    ],
                    anotherWrapper: {
                        image: createImageUrl(image4),
                        images: [
                            createImageUrl(image1),
                            createImageUrl(image2),
                            createImageUrl(image3),
                            createImageUrl(image4),
                            createImageUrl(image5),
                            createImageUrl(image6)
                        ]
                    }
                },
                wrappers: [
                    {
                        image: createImageUrl(image4),
                        images: [
                            createImageUrl(image3),
                            createImageUrl(image5),
                            createImageUrl(image6)
                        ]
                    },
                    {
                        image: createImageUrl(image4),
                        images: [
                            createImageUrl(image1),
                            createImageUrl(image2),
                            createImageUrl(image3),
                            createImageUrl(image4),
                            createImageUrl(image5),
                            createImageUrl(image6)
                        ]
                    }
                ]
            }
        };

        entryAssets.assignAssets(entry);

        expect(Object.keys(entryAssets.assets)).toHaveLength(6);

        const expected: IAsset[] = [
            {
                key: image1,
                url: createImageUrl(image1)
            },
            {
                key: image2,
                url: createImageUrl(image2)
            },
            {
                key: image3,
                url: createImageUrl(image3)
            },
            {
                key: image4,
                url: createImageUrl(image4)
            },
            {
                key: image5,
                url: createImageUrl(image5)
            },
            {
                key: image6,
                url: createImageUrl(image6)
            }
        ];
        expect(Object.values(entryAssets.assets)).toEqual(expected);
    });

    it("should properly extract asset from complex path", async () => {
        const cloudfrontUrl = "https://odisadosadnsakl.cloudfront.aws";
        const filePath = "files";
        const fileKey =
            "demo-pages/6022814891bd1300087bd24c/welcome-to-webiny__webiny-infrastructure-overview!.svg";
        const image = `${cloudfrontUrl}/${filePath}/${fileKey}`;

        const entry: Pick<CmsEntry, "values"> = {
            values: {
                fullName: "John Doe",
                image
            }
        };

        entryAssets.assignAssets(entry);

        const expected: IAsset[] = [
            {
                key: fileKey,
                url: image
            }
        ];

        expect(Object.values(entryAssets.assets)).toEqual(expected);
    });

    it("should properly extract asset alias from a path", async () => {
        const cloudfrontUrl = "https://odisadosadnsakl.cloudfront.aws";
        const filePath = "files";
        const fileKey = "demo-pages/welcome-to-webiny__webiny-infrastructure-overview!.svg";
        const image = `${cloudfrontUrl}/${filePath}/${fileKey}`;

        const entry: Pick<CmsEntry, "values"> = {
            values: {
                fullName: "John Doe",
                image
            }
        };

        entryAssets.assignAssets(entry);

        const expected: IAsset[] = [
            {
                key: fileKey,
                url: image
            }
        ];
        expect(Object.values(entryAssets.assets)).toEqual(expected);
    });
});
