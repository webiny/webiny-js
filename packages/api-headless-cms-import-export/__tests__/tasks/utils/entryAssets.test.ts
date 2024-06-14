import { EntryAssets } from "~/tasks/utils/EntryAssets";
import { useHandler } from "~tests/helpers/useHandler";
import { CmsEntry } from "@webiny/api-headless-cms/types";

describe("entry assets", () => {
    it("should properly initialize EntryAssets", async () => {
        const { handler } = useHandler();

        const context = await handler();

        const traverser = await context.cms.getEntryTraverser("author");

        const entryAssets = new EntryAssets({
            traverser,
            plugins: context.plugins
        });

        expect(entryAssets).toBeInstanceOf(EntryAssets);

        const entry: Pick<CmsEntry, "values"> = {
            values: {
                fullName: "John Doe",
                image: "image.jpg",
                images: ["image1.jpg", "image2.jpg"],
                wrapper: {
                    image: "image4.jpg",
                    images: ["image5.jpg", "image6.jpg"]
                }
            }
        };

        const values = entryAssets.findAssets(entry);

        expect(values).toEqual([
            {
                src: "image.jpg"
            },
            {
                src: "image1.jpg"
            },
            {
                src: "image2.jpg"
            },
            {
                src: "image4.jpg"
            },
            {
                src: "image5.jpg"
            },
            {
                src: "image6.jpg"
            }
        ]);
    });
});
