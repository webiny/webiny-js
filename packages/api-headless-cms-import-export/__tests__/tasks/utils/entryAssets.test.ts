import { EntryAssets, IAsset } from "~/tasks/utils/EntryAssets";
import { useHandler } from "~tests/helpers/useHandler";
import { CmsEntry } from "@webiny/api-headless-cms/types";

const cloudfrontUrl = "https://aCloundfrontDistributionId.cloudfront.net";

const createImagePath = (file: string) => {
    return `/files/${file}`;
};

const createImageUrl = (file: string) => {
    return `${cloudfrontUrl}${createImagePath(file)}`;
};

describe("entry assets", () => {
    it("should properly initialize EntryAssets", async () => {
        const { handler } = useHandler();

        const context = await handler();

        const traverser = await context.cms.getEntryTraverser("author");

        const entryAssets = new EntryAssets({
            traverser
        });

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

        expect(entryAssets.assets.size).toEqual(6);

        const expected: IAsset[] = [
            {
                id: "fileId1234",
                key: image1,
                path: createImagePath(image1),
                url: createImageUrl(image1)
            },
            {
                id: "fileId2345",
                key: image2,
                path: createImagePath(image2),
                url: createImageUrl(image2)
            },
            {
                id: undefined,
                key: image3,
                path: createImagePath(image3),
                url: createImageUrl(image3)
            },
            {
                id: "fileId4567",
                key: image4,
                path: createImagePath(image4),
                url: createImageUrl(image4)
            },
            {
                id: undefined,
                key: image5,
                path: createImagePath(image5),
                url: createImageUrl(image5)
            },
            {
                id: "fileId6789",
                key: image6,
                path: createImagePath(image6),
                url: createImageUrl(image6)
            }
        ];
        expect(Array.from(entryAssets.assets.values())).toEqual(expected);
    });
});
