// @flow
import { assert } from "chai";
import parse from "./../src/extractor/extract";

import example1 from "./parse/example1";
import example2 from "./parse/example2";

describe("parser test", () => {
    it("should parse sources correctly", () => {
        let parsed = parse(example1);

        assert.deepEqual(parsed, {
            "ns1.e4df33e6": "This is ns1 text.",
            "ns2.7d1df6a5": "This is ns2 text.",
            "ns2.b822642e": "This is a text with a {variable} variable and some other {cool} stuff."
        });

        parsed = parse(example2);

        assert.deepEqual(parsed, {
            "Cool.Namespace.2afb5c80": "Service {serviceName} saved!",
            "Cool.Namespace.c83a0e79": "Add service",
            "Cool.Namespace.55a1154d": "Services already added are not shown.",
            "Cool.Namespace.86d16dde": "Select service...",
            "Cool.Namespace.557b5663": "Cancel",
            "Cool.Namespace.b871e64": "Add"
        });
    });
});
