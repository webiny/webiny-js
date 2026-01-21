import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { Properties, toObject } from "@webiny/react-properties";

const getLastCall = (fn: any) => {
    const calls = fn.mock.calls;
    return calls[calls.length - 1][0];
};

const { Title, Logo } = AdminConfig;

describe("AdminConfig Title and Logo", () => {
    it("should create title configuration", () => {
        const onChange = vi.fn();

        render(
            <Properties onChange={onChange}>
                <Title value={"Webiny"} />
            </Properties>
        );

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            tenant: {
                name: "Webiny"
            }
        });
    });

    it("should create logo configuration", () => {
        const onChange = vi.fn();
        const squareLogo = <div>Square Logo</div>;
        const horizontalLogo = <div>Horizontal Logo</div>;

        render(
            <Properties onChange={onChange}>
                <Logo squareLogo={squareLogo} horizontalLogo={horizontalLogo} />
            </Properties>
        );

        const properties = getLastCall(onChange);
        const result = toObject(properties);

        expect(result.tenant).toBeDefined();
        expect(result.tenant.squareLogo).toBeDefined();
        expect(result.tenant.horizontalLogo).toBeDefined();
    });

    it("should create both title and logo configuration", () => {
        const onChange = vi.fn();
        const squareLogo = <div>Square Logo</div>;
        const horizontalLogo = <div>Horizontal Logo</div>;

        render(
            <Properties onChange={onChange}>
                <Title value={"Webiny"} />
                <Logo squareLogo={squareLogo} horizontalLogo={horizontalLogo} />
            </Properties>
        );

        const properties = getLastCall(onChange);
        const result = toObject(properties);

        expect(result.tenant).toBeDefined();
        expect(result.tenant.name).toBe("Webiny");
        expect(result.tenant.squareLogo).toBeDefined();
        expect(result.tenant.horizontalLogo).toBeDefined();
    });
});
