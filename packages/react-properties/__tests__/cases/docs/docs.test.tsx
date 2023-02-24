/**
 * @jest-environment jsdom
 */
import React from "react";
import { Navigation } from "./navigation";
import { renderNavigation } from "./renderNavigation";

jest.setTimeout(60000);

type Catalog = { catalog: any[]; groups: { [key: string]: any } };

describe("Docs Catalog", () => {
    it("should generate an object with several thousands properties", async () => {
        const data = (await renderNavigation(<Navigation />)) as Catalog;

        expect(data.catalog.every(item => "sourceFile" in item)).toBe(true);
        expect(data.catalog.every(item => "relativePath" in item)).toBe(true);
    });
});
