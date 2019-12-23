import SimpleModel from "./models/simpleModel";

describe("driver override test", function() {
    it("should validate given ID correctly (static call)", async () => {
        expect(SimpleModel.isId(123)).toBe(false);
        expect(SimpleModel.isId("01234567890123456789adee")).toBe(true);
    });

    it("should validate given ID correctly (instance call)", async () => {
        const user1 = new SimpleModel();
        expect(user1.isId(123)).toBe(false);
        expect(user1.isId("01234567890123456789adee")).toBe(true);
    });
});
