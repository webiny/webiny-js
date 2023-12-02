import { ResponseHeaders } from "~/ResponseHeaders";

describe("ResponseHeaders class", () => {
    it("should provide a type safe way of modifying headers", async () => {
        const headers = ResponseHeaders.create();

        headers.set("access-control-allow-headers", value => {
            return [value, "x-wby-custom", "x-tenant", "x-i18n-locale"].filter(Boolean).join(",");
        });

        headers.set("x-webiny-version", value => value);

        expect(headers.getHeaders()).toEqual({
            "access-control-allow-headers": "x-wby-custom,x-tenant,x-i18n-locale",
            "x-tenant": undefined
        });
    });
});
