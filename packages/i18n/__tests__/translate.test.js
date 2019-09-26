import i18n, { defaultProcessor } from "@webiny/i18n";

const t = i18n.namespace("Some.Namespace");
i18n.registerProcessor(defaultProcessor);

describe("translate test with namespaces", () => {
    test("should translate correctly without variables", () => {
        i18n.setTranslation("Some.Namespace.577b2243", "this is translated sample text");
        expect(t`this is a sample text`).toEqual("this is translated sample text");
        expect(t`this is a sample text without translation`).toEqual(
            "this is a sample text without translation"
        );
    });

    test("should translate correctly with variables", () => {
        i18n.setTranslation(
            "Some.Namespace.1bd5ff54",
            "this {var1} translated {var2} text for translated {var3} professionals"
        );
        expect(
            t`this {var1} a {var2} text for {var3} people`({
                var1: "is",
                var2: "sample",
                var3: "100"
            })
        ).toEqual("this is translated sample text for translated 100 professionals");

        expect(
            t`this {var1} an UPDATED {var2} text for {var3} people without translation`({
                var1: "is",
                var2: "sample",
                var3: "100"
            })
        ).toEqual("this is an UPDATED sample text for 100 people without translation");
    });

    test("if variable was not found, it should just print initial placeholder", () => {
        expect(
            t`this {var1} is missing for the {count} time`({
                count: "1st"
            })
        ).toEqual("this {var1} is missing for the 1st time");
    });

    test("translate method should throw an error if namespace is not set", () => {
        try {
            i18n.translate("Test");
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown.`);
    });
});
