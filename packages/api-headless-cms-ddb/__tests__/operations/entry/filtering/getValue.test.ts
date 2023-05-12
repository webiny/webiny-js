import { getValue } from "~/operations/entry/filtering/getValue";
import { createEntry } from "./mocks/entry.noModel";

describe("value via object-path", () => {
    it("should find values complex object / array structure", async () => {
        const title = getValue(createEntry(), "values.title");
        expect(title).toEqual(createEntry().values.title);

        const options = getValue(createEntry(), "values.options");
        expect(options).toEqual(createEntry().values.options);

        const variantTitle = getValue(createEntry(), "values.variant.title");
        expect(variantTitle).toEqual(createEntry().values.variant.title);

        const variantSpecificationsKey = getValue(
            createEntry(),
            "values.variant.specifications.key"
        );

        expect(variantSpecificationsKey).toEqual([
            "Specification #1",
            "Specification #2",
            "Specification #3"
        ]);

        const variantSpecificationsInfoImages = getValue(
            createEntry(),
            "values.variant.specifications.info.images"
        );
        expect(variantSpecificationsInfoImages).toEqual([
            { files: ["image1.jpg", "image2.jpg", "image3.jpg", "image4.jpg"] },
            { files: ["image31.jpg", "image32.jpg", "image33.jpg", "image34.jpg"] }
        ]);

        const variantSpecificationsInfoImagesFiles = getValue(
            createEntry(),
            "values.variant.specifications.info.images.files"
        );
        expect(variantSpecificationsInfoImagesFiles).toEqual([
            "image1.jpg",
            "image2.jpg",
            "image3.jpg",
            "image4.jpg",
            "image31.jpg",
            "image32.jpg",
            "image33.jpg",
            "image34.jpg"
        ]);

        const variantSpecificationsInfoTagsKey = getValue(
            createEntry(),
            "values.variant.specifications.info.tags.key"
        );

        expect(variantSpecificationsInfoTagsKey).toEqual(["size", "weight", "price"]);
    });
});
