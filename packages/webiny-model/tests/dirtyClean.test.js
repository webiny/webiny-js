import Model from "./../src/model";

describe("dirty and clean test", () => {
    test("should make attributes dirty", async () => {
        const model = new Model(function() {
            this.attr("firstName").char();
            this.attr("lastName").char();
            this.attr("number").integer();
            this.attr("createdOn").date();
        });

        expect(model.isClean()).toBe(true);

        model.lastName = "Test1";

        expect(model.getAttribute("firstName").value.isDirty()).toBe(false);
        expect(model.getAttribute("lastName").value.isDirty()).toBe(true);
        expect(model.getAttribute("number").value.isDirty()).toBe(false);
        expect(model.getAttribute("createdOn").value.isDirty()).toBe(false);

        expect(model.isClean()).toBe(false);

        model.clean();
        expect(model.isClean()).toBe(true);

        model.lastName = "Test1";
        expect(model.isClean()).toBe(true);

        model.lastName = "Test2";
        expect(model.isClean()).toBe(false);
    });
});
