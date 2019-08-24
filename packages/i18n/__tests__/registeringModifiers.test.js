import i18n, { defaultProcessor } from "@webiny/i18n";
const t = i18n.namespace("Random.Namespace");
i18n.registerProcessor(defaultProcessor);

describe("registering modifiers test", () => {
    test("register and unregister a modifier", () => {
        i18n.registerModifier({
            name: "testModifier",
            execute() {
                return "[MODIFIED CONTENT]";
            }
        });

        expect(t`This is a {testContent|testModifier}`({ testContent: 123 })).toEqual(
            "This is a [MODIFIED CONTENT]"
        );
        i18n.unregisterModifier("testModifier");

        expect(t`This is a {testContent|testModifier}`({ testContent: 123 })).toEqual(
            "This is a 123"
        );
    });
});
