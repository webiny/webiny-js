import { EntityError } from "@webiny/entity";

describe("entity error test", () => {
    test("should set default entity error values", async () => {
        const e = new EntityError("Test");
        expect(e.message).toEqual("Test");
        expect(e.code).toBeNil();
        expect(e.data).toBeNil();
    });

    test("should set message, type and data", async () => {
        const e = new EntityError("Test", "test", { test: true });
        expect(e.message).toEqual("Test");
        expect(e.code).toEqual("test");
        expect(e.data.test).toBe(true);
    });

    test("should set message, type and data using setter methods", async () => {
        const e = new EntityError("Test", "test", { test: true });
        expect(e.message).toEqual("Test");
        expect(e.code).toEqual("test");
        expect(e.data.test).toBe(true);

        e.message = "Test2";
        e.code = "test2";
        e.data = { test: false };

        expect(e.message).toEqual("Test2");
        expect(e.code).toEqual("test2");
        expect(e.data.test).toBe(false);
    });
});
