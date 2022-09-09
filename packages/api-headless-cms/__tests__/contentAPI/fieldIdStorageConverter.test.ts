import { createRawEntry, createModel } from "./mocks/fieldIdStorageConverter";
import { createValueKeyToStorageConverter } from "~/utils/converters";

describe("field id storage converter", () => {
    it("should convert field value paths to storage ones", () => {
        const model = createModel();

        const entry = createRawEntry();
        /**
         * TODO remove checks
         */
        expect(model).toMatchObject({
            modelId: model.modelId
        });
        expect(entry).toMatchObject({
            id: "testEntryId#0001",
            values: {
                name: "John Doe"
            }
        });

        const convert = createValueKeyToStorageConverter({
            model
        });

        const result = convert(entry);
    });
});
