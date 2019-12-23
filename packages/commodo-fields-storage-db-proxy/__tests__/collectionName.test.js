import SimpleModel from "./models/simpleModel";
import { getName } from "@commodo/name";

describe("collection name test", function() {
    it("it should return model name as collection name", async () => {
        expect(SimpleModel.getStorageDriver().getCollectionName(SimpleModel)).toEqual(
            "SimpleModel"
        );

        const model = new SimpleModel();
        expect(model.getStorageDriver().getCollectionName(model)).toEqual("SimpleModel");
    });

    it("it should prepend prefix", async () => {
        SimpleModel.getStorageDriver().setCollectionPrefix("webiny_");
        const model = new SimpleModel();

        expect(SimpleModel.getStorageDriver().getCollectionName(SimpleModel)).toBe(
            "webiny_SimpleModel"
        );
        expect(model.getStorageDriver().getCollectionName(model)).toBe("webiny_SimpleModel");
    });

    it("it should apply collection name naming function", async () => {
        SimpleModel.getStorageDriver()
            .setCollectionPrefix("webiny_webiny_")
            .setCollectionNaming(({ model, driver }) => {
                return driver.getCollectionPrefix() + "_xyz_" + getName(model);
            });

        const model = new SimpleModel();
        expect(typeof SimpleModel.getStorageDriver().getCollectionNaming()).toBe("function");
        expect(SimpleModel.getStorageDriver().getCollectionName(SimpleModel)).toBe("webiny_webiny__xyz_SimpleModel");
        expect(model.getStorageDriver().getCollectionName(SimpleModel)).toBe("webiny_webiny__xyz_SimpleModel");
    });
});
