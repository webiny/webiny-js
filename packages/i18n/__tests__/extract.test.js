import { describe, test, expect } from "vitest";

import extract from "~/extractor/extract";

import example1 from "./extract/example1";
import example2 from "./extract/example2";
import example3 from "./extract/example3";

describe("extractor test", () => {
    test("should extract sources correctly", () => {
        let extracted = extract(example1);

        expect(extracted).toEqual({
            "ns1.5JYSluhe7ZbO5iLQU__3Awv2uqn6wkwemmvUYOLGdUQ": "This is ns1 text.",
            "ns2.eu4h6xnPcnCBmYAn-uMyQuijuiM2x9fu3oFJutfzfaQ": "This is ns2 text.",
            "ns2.pE9Jgwb1yecqx0lELiyRY0sJMh5dX1A7op0CiS8ztqk":
                "This is a text with a {variable} variable and some other {cool} stuff."
        });

        extracted = extract(example2);

        expect(extracted).toEqual({
            "Cool.Namespace.nY-ykPgDPunvzyzSpyn-zzy7mt09R0j9mWbwvcx5tKQ":
                "Service {serviceName} saved!",
            "Cool.Namespace.Dn0eJKui9C7OL7mU_qrlQWrxrfkUvTCx5GjerrtkBcc": "Add service",
            "Cool.Namespace.K4AfOG8QLLy0Y7R2KlLxpK11RlL1nYT0ya613KxiIOE":
                "Services already added are not shown.",
            "Cool.Namespace.uqZiN9i2F8UkSj4KibISxLYz28y8ZXWh984fRi15oP8": "Select service...",
            "Cool.Namespace.TT9A8ExCiAUiVbl4Zj0R0Ef7gMY0cMtOCyq6OWYLUO0": "Cancel",
            "Cool.Namespace.bp5H0v-welsYOByb3rwDRxOxH1yYikRZIjGdDIOmSLs": "Add"
        });

        extracted = extract(example3);

        expect(extracted).toEqual({
            "ns1.w_dHeTkHc7yZt3DtwhPvbCeWcSBc-t_YkjNArZ3YkPw": "published",
            "ns1.OlAeTyE8Z3sgqMUxuodpBBtQlKthXyXIqyuOSV3QIJ4": "draft"
        });
    });
});
