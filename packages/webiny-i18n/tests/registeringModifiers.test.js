// @flow
import { assert } from "chai";

import i18n from "./..";
const t = i18n.namespace("Random.Namespace");

describe("registering modifiers test", () => {
    it("register and unregister a modifier", () => {
        i18n.registerModifier({
            name: "testModifier",
            execute() {
                return "[MODIFIED CONTENT]";
            }
        });

        assert.equal(
            t`This is a {testContent|testModifier}`({ testContent: 123 }),
            "This is a [MODIFIED CONTENT]"
        );
        i18n.unregisterModifier("testModifier");

        assert.equal(
            t`This is a {testContent|testModifier}`({ testContent: 123 }),
            "This is a 123"
        );
    });
});
