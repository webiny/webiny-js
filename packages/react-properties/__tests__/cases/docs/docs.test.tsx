/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { Properties, toObject } from "~/index";
import { getLastCall } from "~tests/utils";
import { Navigation } from "./navigation";

jest.setTimeout(60000);

type Catalog = { catalog: any[]; groups: { [key: string]: any } };

const renderNavigation = async (element: JSX.Element): Promise<Catalog> => {
    const onChange = jest.fn();

    const view = <Properties onChange={onChange}>{element}</Properties>;

    render(view);

    const properties = getLastCall(onChange);
    return toObject(properties);
};

describe("Docs Catalog", () => {
    it("should generate an object with several thousands properties", async () => {
        const data = await renderNavigation(<Navigation />);

        expect(data.catalog.every(item => "sourceFile" in item)).toBe(true);
        expect(data.catalog.every(item => "relativePath" in item)).toBe(true);
    });
});
