import { describe, expect, it } from "vitest";
import { diffValues } from "~/core/diff/diffValues.js";
import { object, scalar, summarise, template, zone } from "./descriptorHelpers.js";

const item = (id: string, values: Record<string, unknown>) => ({ _id: id, ...values });
const block = (id: string, templateId: string, values: Record<string, unknown> = {}) => ({
    _id: id,
    _templateId: templateId,
    ...values
});

describe("diffValues", () => {
    describe("scalars", () => {
        const fields = [scalar("title"), scalar("body")];

        it("reports a changed field and nothing else", () => {
            const result = diffValues(
                fields,
                { title: "a", body: "keep" },
                {
                    title: "b",
                    body: "keep"
                }
            );

            expect(summarise(result.changeset)).toEqual(["title"]);
        });

        it("reports nothing when nothing changed", () => {
            const result = diffValues(fields, { title: "a" }, { title: "a" });

            expect(result.changeset).toEqual([]);
        });

        it("does not report a field cleared to empty string against an absent one", () => {
            // The admin form sends "", a GraphQL write sends null, a shallow merge drops the key.
            // None of the three is an edit, and reporting one would put noise on every timeline.
            expect(diffValues(fields, { title: "" }, {}).changeset).toEqual([]);
            expect(diffValues(fields, { title: null }, { title: "" }).changeset).toEqual([]);
        });

        it("reports a field that was actually cleared", () => {
            const result = diffValues(fields, { title: "a" }, { title: "" });

            expect(summarise(result.changeset)).toEqual(["title"]);
        });

        it("treats a list of scalars as one change rather than per index", () => {
            const listFields = [scalar("tags", true)];
            const result = diffValues(listFields, { tags: ["a", "b"] }, { tags: ["a", "c"] });

            expect(summarise(result.changeset)).toEqual(["tags"]);
        });

        it("carries the label captured from the model", () => {
            const result = diffValues(
                [{ ...scalar("title"), label: "Headline" }],
                { title: "a" },
                {
                    title: "b"
                }
            );

            expect(result.changeset[0]!.label).toBe("Headline");
        });
    });

    describe("nested objects", () => {
        const fields = [object("author", [scalar("name"), scalar("email")])];

        it("reports the deep path, not the container", () => {
            const result = diffValues(
                fields,
                { author: { name: "x", email: "e" } },
                { author: { name: "y", email: "e" } }
            );

            expect(summarise(result.changeset)).toEqual(["author.name"]);
        });

        it("does not descend into an unchanged subtree", () => {
            const result = diffValues(
                fields,
                { author: { name: "x", email: "e" } },
                { author: { name: "x", email: "e" } }
            );

            expect(result.changeset).toEqual([]);
        });

        it("reports a whole block appearing without listing its fields", () => {
            const result = diffValues(fields, {}, { author: { name: "x", email: "e" } });

            expect(summarise(result.changeset)).toEqual(["added author"]);
        });

        it("reports a whole block disappearing without listing its fields", () => {
            const result = diffValues(fields, { author: { name: "x" } }, {});

            expect(summarise(result.changeset)).toEqual(["removed author"]);
        });

        it("reports a path three levels deep", () => {
            const deep = [object("a", [object("b", [scalar("c")])])];
            const result = diffValues(deep, { a: { b: { c: "one" } } }, { a: { b: { c: "two" } } });

            expect(summarise(result.changeset)).toEqual(["a.b.c"]);
        });
    });

    describe("repeatable objects, matched on stable id", () => {
        const fields = [object("sections", [scalar("title")], true)];

        it("reports the edited item by id", () => {
            const result = diffValues(
                fields,
                { sections: [item("aaa", { title: "1" }), item("bbb", { title: "2" })] },
                { sections: [item("aaa", { title: "1" }), item("bbb", { title: "CHANGED" })] }
            );

            expect(summarise(result.changeset)).toEqual(["sections#bbb.title"]);
        });

        it("reports one addition when a block is inserted, not a cascade of moves", () => {
            // The whole point of the order-preserving subsequence: inserting at position 1 shifts
            // every later block's index, and naive comparison would call all of them moved.
            const result = diffValues(
                fields,
                {
                    sections: [
                        item("aaa", { title: "1" }),
                        item("bbb", { title: "2" }),
                        item("ccc", { title: "3" })
                    ]
                },
                {
                    sections: [
                        item("aaa", { title: "1" }),
                        item("nnn", { title: "new" }),
                        item("bbb", { title: "2" }),
                        item("ccc", { title: "3" })
                    ]
                }
            );

            expect(summarise(result.changeset)).toEqual(["added sections#nnn"]);
        });

        it("reports one removal when a block is deleted", () => {
            const result = diffValues(
                fields,
                { sections: [item("aaa", { title: "1" }), item("bbb", { title: "2" })] },
                { sections: [item("aaa", { title: "1" })] }
            );

            expect(summarise(result.changeset)).toEqual(["removed sections#bbb"]);
        });

        it("reports one move when a block is dragged to the front", () => {
            const result = diffValues(
                fields,
                {
                    sections: [
                        item("aaa", { title: "1" }),
                        item("bbb", { title: "2" }),
                        item("ccc", { title: "3" })
                    ]
                },
                {
                    sections: [
                        item("ccc", { title: "3" }),
                        item("aaa", { title: "1" }),
                        item("bbb", { title: "2" })
                    ]
                }
            );

            expect(summarise(result.changeset)).toEqual(["moved sections#ccc"]);
        });

        it("reports both the move and the edit when a block is dragged and changed", () => {
            // A moved block exists on both sides, so unlike an addition it is still worth
            // descending into. Two things happened and a reader wants both.
            const result = diffValues(
                fields,
                { sections: [item("aaa", { title: "1" }), item("bbb", { title: "2" })] },
                { sections: [item("bbb", { title: "EDITED" }), item("aaa", { title: "1" })] }
            );

            expect(summarise(result.changeset)).toEqual([
                "moved sections#bbb",
                "sections#bbb.title"
            ]);
        });

        it("does not descend into an added block", () => {
            const result = diffValues(
                fields,
                { sections: [] },
                { sections: [item("nnn", { title: "brand new" })] }
            );

            expect(summarise(result.changeset)).toEqual(["added sections#nnn"]);
        });

        it("reports nothing when a repeatable field is untouched", () => {
            const sections = [item("aaa", { title: "1" }), item("bbb", { title: "2" })];
            const result = diffValues(fields, { sections }, { sections: [...sections] });

            expect(result.changeset).toEqual([]);
        });
    });

    describe("id churn", () => {
        const fields = [object("sections", [scalar("title")], true)];

        it("treats a rewritten id with identical content as the same block", () => {
            // This is the rule that stops an import or migration reporting an entire page as
            // deleted and re-added.
            const result = diffValues(
                fields,
                { sections: [item("aaa", { title: "1" }), item("bbb", { title: "2" })] },
                { sections: [item("xxx", { title: "1" }), item("yyy", { title: "2" })] }
            );

            expect(result.changeset).toEqual([]);
        });

        it("reports a churned block that also changed as a removal plus an addition", () => {
            // A documented boundary of the churn rule, not an oversight. The rule recognises a
            // new id whose *content* matches something that disappeared. When the content changed
            // too, there is nothing left to match on: both sides carry ids, they disagree, and no
            // hash lines up. Reporting the edit would mean assuming that position implies
            // identity, which is exactly the assumption stable ids exist to remove.
            //
            // The practical cost is narrow: an import that rewrites every id *and* edits some
            // blocks reports those blocks as replaced while the untouched ones stay silent.
            const result = diffValues(
                fields,
                { sections: [item("aaa", { title: "1" }), item("bbb", { title: "2" })] },
                { sections: [item("xxx", { title: "1" }), item("yyy", { title: "CHANGED" })] }
            );

            expect(summarise(result.changeset).sort()).toEqual([
                "added sections#yyy",
                "removed sections#bbb"
            ]);
        });

        it("does not treat two differently-identified, differently-contented blocks as one", () => {
            // Both sides carry ids and neither id nor content matches, so identity has spoken.
            const result = diffValues(
                fields,
                { sections: [item("aaa", { title: "1" })] },
                { sections: [item("xxx", { title: "totally different" })] }
            );

            expect(summarise(result.changeset).sort()).toEqual([
                "added sections#xxx",
                "removed sections#aaa"
            ]);
        });
    });

    describe("identity being established", () => {
        const fields = [object("sections", [scalar("title")], true)];

        it("reports nothing when id-less items gain ids without changing", () => {
            // Every entry written before stable ids carries none until its next save. If this
            // reported a replacement, the first save of every pre-upgrade entry would emit a junk
            // record claiming the whole entry was rewritten.
            const result = diffValues(
                fields,
                { sections: [{ title: "1" }, { title: "2" }] },
                { sections: [item("aaa", { title: "1" }), item("bbb", { title: "2" })] }
            );

            expect(result.changeset).toEqual([]);
        });

        it("reports only the edit when ids arrive in the same save as a change", () => {
            const result = diffValues(
                fields,
                { sections: [{ title: "1" }, { title: "2" }] },
                { sections: [item("aaa", { title: "1" }), item("bbb", { title: "CHANGED" })] }
            );

            expect(summarise(result.changeset)).toEqual(["sections#bbb.title"]);
        });
    });

    describe("id-less lists, which is every list on this branch", () => {
        const fields = [object("sections", [scalar("title")], true)];

        it("reports an edit as an edit, not a removal plus an addition", () => {
            const result = diffValues(
                fields,
                { sections: [{ title: "1" }, { title: "2" }] },
                { sections: [{ title: "1" }, { title: "CHANGED" }] }
            );

            expect(summarise(result.changeset)).toEqual(["sections[1].title"]);
        });

        it("reports an appended item as an addition", () => {
            const result = diffValues(
                fields,
                { sections: [{ title: "1" }] },
                { sections: [{ title: "1" }, { title: "2" }] }
            );

            expect(summarise(result.changeset)).toEqual(["added sections[1]"]);
        });

        it("reports a deleted item as a removal", () => {
            const result = diffValues(
                fields,
                { sections: [{ title: "1" }, { title: "2" }] },
                { sections: [{ title: "1" }] }
            );

            expect(summarise(result.changeset)).toEqual(["removed sections[1]"]);
        });

        it("uses positional paths, since there is no identity to key on", () => {
            const result = diffValues(
                fields,
                { sections: [{ title: "1" }] },
                { sections: [{ title: "2" }] }
            );

            expect(summarise(result.changeset)).toEqual(["sections[0].title"]);
        });
    });

    describe("dynamic zones", () => {
        const fields = [
            zone("blocks", [
                template("hero", [scalar("headline")]),
                template("text", [scalar("body")])
            ])
        ];

        it("reports an edit inside the matching template", () => {
            const result = diffValues(
                fields,
                { blocks: [block("aaa", "hero", { headline: "one" })] },
                { blocks: [block("aaa", "hero", { headline: "two" })] }
            );

            expect(summarise(result.changeset)).toEqual(["blocks#aaa.headline"]);
        });

        it("reports a template swap as a replacement without descending", () => {
            // The old and new fields are different fields. Listing them as changes would describe
            // a form the editor never filled in.
            const result = diffValues(
                fields,
                { blocks: [block("aaa", "hero", { headline: "one" })] },
                { blocks: [block("aaa", "text", { body: "prose" })] }
            );

            expect(summarise(result.changeset)).toEqual(["replaced blocks#aaa"]);
        });

        it("reports a block whose template the model no longer defines", () => {
            const result = diffValues(
                fields,
                { blocks: [block("aaa", "retired", { legacy: "one" })] },
                { blocks: [block("aaa", "retired", { legacy: "two" })] }
            );

            expect(summarise(result.changeset)).toEqual(["blocks#aaa"]);
        });

        it("reports an added block once", () => {
            const result = diffValues(
                fields,
                { blocks: [block("aaa", "hero", { headline: "one" })] },
                {
                    blocks: [
                        block("aaa", "hero", { headline: "one" }),
                        block("bbb", "text", { body: "prose" })
                    ]
                }
            );

            expect(summarise(result.changeset)).toEqual(["added blocks#bbb"]);
        });
    });

    describe("the cap", () => {
        it("does not roll up a changeset within the cap", () => {
            const fields = [scalar("a"), scalar("b")];
            const result = diffValues(
                fields,
                { a: "1", b: "1" },
                { a: "2", b: "2" },
                {
                    maxEntries: 5
                }
            );

            expect(result.truncated).toBe(false);
            expect(result.changeset).toHaveLength(2);
        });

        it("rolls the overflow up to its nearest common parent", () => {
            const fields = [object("author", [scalar("a"), scalar("b"), scalar("c")])];
            const result = diffValues(
                fields,
                { author: { a: "1", b: "1", c: "1" } },
                { author: { a: "2", b: "2", c: "2" } },
                { maxEntries: 1 }
            );

            expect(result.truncated).toBe(true);
            expect(summarise(result.changeset)).toEqual(["author.a", "author"]);
        });

        it("rolls up to the target root when the overflow shares no ancestor", () => {
            const fields = [scalar("a"), scalar("b"), scalar("c")];
            const result = diffValues(
                fields,
                { a: "1", b: "1", c: "1" },
                { a: "2", b: "2", c: "2" },
                { maxEntries: 1 }
            );

            expect(result.truncated).toBe(true);
            expect(result.changeset).toHaveLength(2);
            expect(result.changeset[1]).toEqual({ path: "", label: "" });
        });

        it("labels the rolled-up entry from the model", () => {
            const fields = [
                {
                    ...object("author", [scalar("a"), scalar("b"), scalar("c")]),
                    label: "Author"
                }
            ];
            const result = diffValues(
                fields,
                { author: { a: "1", b: "1", c: "1" } },
                { author: { a: "2", b: "2", c: "2" } },
                { maxEntries: 1 }
            );

            expect(result.changeset[1]).toEqual({ path: "author", label: "Author" });
        });

        it("leaves a single overflow entry at its own path", () => {
            // The common ancestor of one path is that path, so nothing is summarised away and no
            // information is lost — the record is simply marked truncated.
            const fields = [object("author", [scalar("a"), scalar("b")])];
            const result = diffValues(
                fields,
                { author: { a: "1", b: "1" } },
                { author: { a: "2", b: "2" } },
                { maxEntries: 1 }
            );

            expect(result.truncated).toBe(true);
            expect(summarise(result.changeset)).toEqual(["author.a", "author.b"]);
        });
    });

    describe("robustness", () => {
        it("survives a null item in a repeatable field", () => {
            const fields = [object("sections", [scalar("title")], true)];

            expect(() =>
                diffValues(fields, { sections: [null] }, { sections: [{ title: "x" }] })
            ).not.toThrow();
        });

        it("survives a field holding the wrong shape entirely", () => {
            const fields = [object("sections", [scalar("title")], true)];
            const result = diffValues(fields, { sections: "not a list" }, { sections: [] });

            expect(result.truncated).toBe(false);
        });

        it("reports nothing for two empty entries", () => {
            expect(diffValues([scalar("title")], {}, {}).changeset).toEqual([]);
        });

        it("accepts null value trees", () => {
            expect(diffValues([scalar("title")], null, null).changeset).toEqual([]);
        });
    });
});
