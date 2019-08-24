import extract from "@webiny/i18n/extractor/extract";

import example1 from "./extract/example1";
import example2 from "./extract/example2";
import example3 from "./extract/example3";

describe("extractor test", () => {
    test("should extract sources correctly", () => {
        let extracted = extract(example1);

        expect(extracted).toEqual({
            "ns1.e4df33e6": "This is ns1 text.",
            "ns2.7d1df6a5": "This is ns2 text.",
            "ns2.b822642e": "This is a text with a {variable} variable and some other {cool} stuff."
        });

        extracted = extract(example2);

        expect(extracted).toEqual({
            "Cool.Namespace.2afb5c80": "Service {serviceName} saved!",
            "Cool.Namespace.c83a0e79": "Add service",
            "Cool.Namespace.55a1154d": "Services already added are not shown.",
            "Cool.Namespace.86d16dde": "Select service...",
            "Cool.Namespace.557b5663": "Cancel",
            "Cool.Namespace.b871e64": "Add"
        });

        extracted = extract(example3);

        expect(extracted).toEqual({ "ns1.665d09fd": "published", "ns1.ae83940": "draft" });
    });
});
