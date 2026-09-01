import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveContentEntries } from "./resolveContentEntries.js";
import { contentEntryCache } from "@webiny/website-builder-sdk";
import type { Document } from "@webiny/website-builder-sdk";

// Mock the CMS SDK so `ensureContentEntryLoader` wires up a controllable loader.
const mockGetEntry = vi.fn();
const mockListEntries = vi.fn();

vi.mock("@webiny/cms-sdk", () => ({
    contentSdk: {
        getEntry: (...args: unknown[]) => mockGetEntry(...args),
        listEntries: (...args: unknown[]) => mockListEntries(...args)
    }
}));

const entry = (id: string) => ({ id, entryId: id, values: { title: `T${id}` } });

function makeDocument(overrides: Partial<Document> = {}): Document {
    return {
        id: "doc1",
        version: 1,
        state: {},
        properties: {},
        extensions: {},
        metadata: {},
        bindings: {},
        elements: {},
        ...overrides
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton cache between tests.
    (contentEntryCache as any).cache?.clear?.();
    (contentEntryCache as any).loader = undefined;

    mockGetEntry.mockImplementation(async ({ entryId }: { entryId: string }) => entry(entryId));
    mockListEntries.mockImplementation(async () => ({
        data: [entry("q1"), entry("q2")],
        meta: { cursor: "c1", hasMoreItems: false, totalCount: 2 }
    }));
});

describe("resolveContentEntries — binding-type-based resolution", () => {
    it("does nothing for a null document", async () => {
        await resolveContentEntries(null);
        expect(mockGetEntry).not.toHaveBeenCalled();
    });

    it("does nothing when no elements have content-entry bindings", async () => {
        const doc = makeDocument({
            elements: {
                el1: {
                    id: "el1",
                    type: "Webiny/Element",
                    component: { name: "MyComponent" }
                }
            },
            bindings: {
                el1: {
                    inputs: {
                        text: { id: "text", type: "text", static: "hello" }
                    }
                }
            }
        });

        await resolveContentEntries(doc);
        expect(mockGetEntry).not.toHaveBeenCalled();
        expect(doc.__cache).toBeUndefined();
    });

    it("resolves a manual single content-entry input", async () => {
        const doc = makeDocument({
            elements: {
                el1: {
                    id: "el1",
                    type: "Webiny/Element",
                    component: { name: "MyComponent" }
                }
            },
            bindings: {
                el1: {
                    inputs: {
                        article: {
                            id: "article",
                            type: "contentEntry",
                            static: { id: "42", modelId: "blog" }
                        }
                    }
                }
            }
        });

        await resolveContentEntries(doc);

        expect(mockGetEntry).toHaveBeenCalledWith({ modelId: "blog", entryId: "42" });
        expect(doc.__cache?.contentEntries).toBeDefined();
        expect((doc.__cache!.contentEntries as Record<string, unknown>)["el1:article"]).toEqual(
            entry("42")
        );
    });

    it("resolves a manual list content-entry input", async () => {
        const doc = makeDocument({
            elements: {
                el1: {
                    id: "el1",
                    type: "Webiny/Element",
                    component: { name: "MyComponent" }
                }
            },
            bindings: {
                el1: {
                    inputs: {
                        articles: {
                            id: "articles",
                            type: "contentEntry",
                            list: true,
                            static: [
                                { id: "1", modelId: "blog" },
                                { id: "2", modelId: "blog" }
                            ]
                        }
                    }
                }
            }
        });

        await resolveContentEntries(doc);

        expect(mockGetEntry).toHaveBeenCalledTimes(2);
        const resolved = (doc.__cache!.contentEntries as Record<string, unknown>)["el1:articles"];
        expect(resolved).toEqual([entry("1"), entry("2")]);
    });

    it("resolves a query-mode content-entry input (modelId in value)", async () => {
        const doc = makeDocument({
            elements: {
                el1: {
                    id: "el1",
                    type: "Webiny/Element",
                    component: { name: "MyComponent" }
                }
            },
            bindings: {
                el1: {
                    inputs: {
                        posts: {
                            id: "posts",
                            type: "contentEntry",
                            static: { modelId: "blog", limit: 5 }
                        }
                    }
                }
            }
        });

        await resolveContentEntries(doc);

        expect(mockListEntries).toHaveBeenCalledWith(
            expect.objectContaining({ modelId: "blog", limit: 5 })
        );
        const resolved = (doc.__cache!.contentEntries as Record<string, unknown>)["el1:posts"];
        expect(resolved).toMatchObject({
            items: [entry("q1"), entry("q2")],
            pageInfo: expect.objectContaining({ totalCount: 2 })
        });
    });

    it("passes through already-resolved entries without re-fetching", async () => {
        const resolvedEntry = { id: "42", entryId: "42", values: { title: "Already resolved" } };
        const doc = makeDocument({
            elements: {
                el1: {
                    id: "el1",
                    type: "Webiny/Element",
                    component: { name: "MyComponent" }
                }
            },
            bindings: {
                el1: {
                    inputs: {
                        article: {
                            id: "article",
                            type: "contentEntry",
                            static: resolvedEntry
                        }
                    }
                }
            }
        });

        await resolveContentEntries(doc);

        expect(mockGetEntry).not.toHaveBeenCalled();
        expect((doc.__cache!.contentEntries as Record<string, unknown>)["el1:article"]).toEqual(
            resolvedEntry
        );
    });

    it("handles multiple elements with content-entry inputs", async () => {
        const doc = makeDocument({
            elements: {
                el1: {
                    id: "el1",
                    type: "Webiny/Element",
                    component: { name: "Hero" }
                },
                el2: {
                    id: "el2",
                    type: "Webiny/Element",
                    component: { name: "Sidebar" }
                }
            },
            bindings: {
                el1: {
                    inputs: {
                        featured: {
                            id: "featured",
                            type: "contentEntry",
                            static: { id: "10", modelId: "article" }
                        }
                    }
                },
                el2: {
                    inputs: {
                        related: {
                            id: "related",
                            type: "contentEntry",
                            static: { id: "20", modelId: "article" }
                        }
                    }
                }
            }
        });

        await resolveContentEntries(doc);

        expect(mockGetEntry).toHaveBeenCalledTimes(2);
        const resolved = doc.__cache!.contentEntries as Record<string, unknown>;
        expect(resolved["el1:featured"]).toEqual(entry("10"));
        expect(resolved["el2:related"]).toEqual(entry("20"));
    });

    it("skips non-contentEntry bindings", async () => {
        const doc = makeDocument({
            elements: {
                el1: {
                    id: "el1",
                    type: "Webiny/Element",
                    component: { name: "Mixed" }
                }
            },
            bindings: {
                el1: {
                    inputs: {
                        text: { id: "text", type: "text", static: "hello" },
                        number: { id: "number", type: "number", static: 42 },
                        item: {
                            id: "item",
                            type: "contentEntry",
                            static: { id: "5", modelId: "blog" }
                        }
                    }
                }
            }
        });

        await resolveContentEntries(doc);

        // Only the contentEntry input should be resolved.
        expect(mockGetEntry).toHaveBeenCalledTimes(1);
        expect(mockGetEntry).toHaveBeenCalledWith({ modelId: "blog", entryId: "5" });
    });
});
