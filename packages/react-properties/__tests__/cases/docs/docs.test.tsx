import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Properties, toObject } from "~/index";
import { getLastCall, flush } from "~tests/utils";
import { Navigation } from "./navigation";

type Catalog = { catalog: any[]; groups: { [key: string]: any } };

const renderNavigation = async (element: JSX.Element): Promise<Catalog> => {
    const onChange = vi.fn();

    const view = <Properties onChange={onChange}>{element}</Properties>;

    render(view);
    await flush();

    const properties = getLastCall(onChange);
    return toObject(properties);
};

describe("Docs Catalog", { timeout: 60000 }, () => {
    it("should generate an object with several thousands properties", async () => {
        const data = await renderNavigation(<Navigation />);

        expect(data.catalog.every(item => "sourceFile" in item)).toBe(true);
        expect(data.catalog.every(item => "relativePath" in item)).toBe(true);
    });
});
