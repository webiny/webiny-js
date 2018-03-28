// @flow
import { assert } from "chai";
import i18n from "./..";

const t = i18n.namespace("Some.Namespace");

describe("translate test with namespaces", () => {
    it("should translate correctly without variables", () => {
        i18n.setTranslation("Some.Namespace.577b2243", "this is translated sample text");
        assert.equal(t`this is a sample text`, "this is translated sample text");
        assert.equal(
            t`this is a sample text without translation`,
            "this is a sample text without translation"
        );
    });

    it("should translate correctly with variables", () => {
        i18n.setTranslation(
            "Some.Namespace.1bd5ff54",
            "this {var1} translated {var2} text for translated {var3} professionals"
        );
        assert.equal(
            t`this {var1} a {var2} text for {var3} people`({
                var1: "is",
                var2: "sample",
                var3: "100"
            }),
            "this is translated sample text for translated 100 professionals"
        );

        assert.equal(
            t`this {var1} an UPDATED {var2} text for {var3} people without translation`({
                var1: "is",
                var2: "sample",
                var3: "100"
            }),
            "this is an UPDATED sample text for 100 people without translation"
        );
    });

    it("if variable was not found, it should just print initial placeholder", () => {
        assert.equal(
            t`this {var1} is missing for the {count} time`({
                count: "1st"
            }),
            "this {var1} is missing for the 1st time"
        );
    });

    it("if variable is in format {value, format}, format function must be called", () => {
        assert.equal(
            t`this {var1} is missing for the {count} time`({
                count: { value: "1st", format: value => `<strong>${value}</strong>` }
            }),
            "this {var1} is missing for the <strong>1st</strong> time"
        );

        assert.equal(
            t`this {var1} is missing for the {count} time`({ count: { value: "1st" } }),
            "this {var1} is missing for the 1st time"
        );
    });

    it('if variable is format {format} (without the key "value"), error must be thrown', () => {
        try {
            t`this {var1} is missing for the {count} time`({
                count: { format: value => `<strong>${value}</strong>` }
            });
        } catch (e) {
            assert.equal(e.message, `Key "value" is missing for variable {count}.`);
            return;
        }

        throw Error(`Error should've been thrown`);
    });

    it("translate method should throw an error if namespace is not set", () => {
        try {
            i18n.translate("Test");
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown.`);
    });
});
