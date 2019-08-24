import { assert } from "chai";

import SimpleEntity from "./entities/simpleEntity";

describe("collection name test", function() {
    it("it should return classId as collection name", async () => {
        assert.equal(SimpleEntity.getDriver().getCollectionName(SimpleEntity), "SimpleEntity");

        const entity = new SimpleEntity();
        assert.equal(entity.getDriver().getCollectionName(entity), "SimpleEntity");
    });

    it("it should return collectionName, defined on the class", async () => {
        class CustomCollectionEntity extends SimpleEntity {}

        CustomCollectionEntity.collectionName = "SuperCustom";
        const entity = new CustomCollectionEntity();

        assert.equal(CustomCollectionEntity.getDriver().getCollectionName(CustomCollectionEntity), "SuperCustom");
        assert.equal(entity.getDriver().getCollectionName(entity), "SuperCustom");
    });

    it("it should prepend prefix", async () => {
        SimpleEntity.getDriver().setCollectionPrefix("webiny_");
        const entity = new SimpleEntity();

        assert.equal(SimpleEntity.getDriver().getCollectionName(SimpleEntity), "webiny_SimpleEntity");
        assert.equal(entity.getDriver().getCollectionName(entity), "webiny_SimpleEntity");
    });

    it("it should apply collection name naming function", async () => {
        SimpleEntity.collectionName = "SuperCustom";
        SimpleEntity.getDriver()
            .setCollectionPrefix("webiny_webiny_")
            .setCollectionNaming(({ classId, collectionName, driver }) => {
                return driver.getCollectionPrefix() + classId + collectionName;
            });

        const entity = new SimpleEntity();
        assert.isFunction(SimpleEntity.getDriver().getCollectionNaming());
        assert.equal(
            SimpleEntity.getDriver().getCollectionName(SimpleEntity),
            "webiny_webiny_SimpleEntitySuperCustom"
        );
        assert.equal(
            entity.getDriver().getCollectionName(entity),
            "webiny_webiny_SimpleEntitySuperCustom"
        );
    });
});
