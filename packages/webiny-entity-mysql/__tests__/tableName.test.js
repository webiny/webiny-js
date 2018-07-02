import SimpleEntity from "./entities/simpleEntity";

describe("table name test", () => {
    test("it should return classId as table name", async () => {
        expect(SimpleEntity.getDriver().getTableName(SimpleEntity)).toEqual("SimpleEntity");

        const entity = new SimpleEntity();
        expect(entity.getDriver().getTableName(entity)).toEqual("SimpleEntity");
    });

    test("it should return tableName, defined on the class", async () => {
        class CustomTableEntity extends SimpleEntity {}

        CustomTableEntity.tableName = "SuperCustom";
        const entity = new CustomTableEntity();

        expect(CustomTableEntity.getDriver().getTableName(CustomTableEntity)).toEqual(
            "SuperCustom"
        );
        expect(entity.getDriver().getTableName(entity)).toEqual("SuperCustom");
    });

    test("it should prepend prefix", async () => {
        SimpleEntity.getDriver().setTablePrefix("webiny_");
        const entity = new SimpleEntity();

        expect(SimpleEntity.getDriver().getTableName(SimpleEntity)).toEqual("webiny_SimpleEntity");
        expect(entity.getDriver().getTableName(entity)).toEqual("webiny_SimpleEntity");
    });

    test("it should apply table name naming function", async () => {
        SimpleEntity.tableName = "SuperCustom";
        SimpleEntity.getDriver()
            .setTablePrefix("webiny_webiny_")
            .setTableNaming(({ classId, tableName, driver }) => {
                return driver.getTablePrefix() + classId + tableName;
            });

        const entity = new SimpleEntity();
        expect(typeof SimpleEntity.getDriver().getTableNaming()).toBe("function");
        expect(SimpleEntity.getDriver().getTableName(SimpleEntity)).toEqual(
            "webiny_webiny_SimpleEntitySuperCustom"
        );
        expect(entity.getDriver().getTableName(entity)).toEqual(
            "webiny_webiny_SimpleEntitySuperCustom"
        );
    });
});
