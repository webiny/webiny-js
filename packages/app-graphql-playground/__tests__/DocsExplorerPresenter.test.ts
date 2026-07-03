import { describe, it, expect, beforeEach } from "vitest";
import { DefaultDocsExplorerPresenter } from "~/presentation/DocsExplorer/DocsExplorerPresenter";
import type { IDocsExplorerPresenter } from "~/presentation/DocsExplorer/abstractions";

function createPresenter(): IDocsExplorerPresenter {
    const Ctor = DefaultDocsExplorerPresenter as any;
    return new Ctor() as IDocsExplorerPresenter;
}

function createSchema() {
    return {
        queryType: { name: "Query" },
        mutationType: { name: "Mutation" },
        subscriptionType: null,
        types: [
            {
                name: "Query",
                kind: "OBJECT",
                description: "Root query type.",
                fields: [
                    {
                        name: "user",
                        description: "Get a user by ID.",
                        type: { kind: "OBJECT", name: "User", ofType: null },
                        args: [
                            {
                                name: "id",
                                description: "User ID.",
                                type: {
                                    kind: "NON_NULL",
                                    name: null,
                                    ofType: { kind: "SCALAR", name: "ID", ofType: null }
                                },
                                defaultValue: null
                            }
                        ]
                    },
                    {
                        name: "posts",
                        description: "List posts.",
                        type: {
                            kind: "NON_NULL",
                            name: null,
                            ofType: {
                                kind: "LIST",
                                name: null,
                                ofType: {
                                    kind: "NON_NULL",
                                    name: null,
                                    ofType: { kind: "OBJECT", name: "Post", ofType: null }
                                }
                            }
                        },
                        args: []
                    }
                ],
                inputFields: null,
                enumValues: null,
                interfaces: [],
                possibleTypes: null
            },
            {
                name: "Mutation",
                kind: "OBJECT",
                description: null,
                fields: [
                    {
                        name: "createPost",
                        description: "Create a new post.",
                        type: { kind: "OBJECT", name: "Post", ofType: null },
                        args: [
                            {
                                name: "input",
                                description: null,
                                type: {
                                    kind: "NON_NULL",
                                    name: null,
                                    ofType: {
                                        kind: "INPUT_OBJECT",
                                        name: "CreatePostInput",
                                        ofType: null
                                    }
                                },
                                defaultValue: null
                            }
                        ]
                    }
                ],
                inputFields: null,
                enumValues: null,
                interfaces: [],
                possibleTypes: null
            },
            {
                name: "User",
                kind: "OBJECT",
                description: "A user account.",
                fields: [
                    {
                        name: "id",
                        description: null,
                        type: {
                            kind: "NON_NULL",
                            name: null,
                            ofType: { kind: "SCALAR", name: "ID", ofType: null }
                        },
                        args: []
                    },
                    {
                        name: "name",
                        description: "Display name.",
                        type: { kind: "SCALAR", name: "String", ofType: null },
                        args: []
                    },
                    {
                        name: "posts",
                        description: null,
                        type: {
                            kind: "NON_NULL",
                            name: null,
                            ofType: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "Post", ofType: null }
                            }
                        },
                        args: []
                    }
                ],
                inputFields: null,
                enumValues: null,
                interfaces: [],
                possibleTypes: null
            },
            {
                name: "Post",
                kind: "OBJECT",
                description: "A blog post.",
                fields: [
                    {
                        name: "id",
                        description: null,
                        type: {
                            kind: "NON_NULL",
                            name: null,
                            ofType: { kind: "SCALAR", name: "ID", ofType: null }
                        },
                        args: []
                    },
                    {
                        name: "title",
                        description: null,
                        type: { kind: "SCALAR", name: "String", ofType: null },
                        args: []
                    },
                    {
                        name: "author",
                        description: null,
                        type: { kind: "OBJECT", name: "User", ofType: null },
                        args: []
                    },
                    {
                        name: "status",
                        description: null,
                        type: { kind: "ENUM", name: "PostStatus", ofType: null },
                        args: []
                    }
                ],
                inputFields: null,
                enumValues: null,
                interfaces: [],
                possibleTypes: null
            },
            {
                name: "CreatePostInput",
                kind: "INPUT_OBJECT",
                description: "Input for creating a post.",
                fields: null,
                inputFields: [
                    {
                        name: "title",
                        description: "Post title.",
                        type: {
                            kind: "NON_NULL",
                            name: null,
                            ofType: { kind: "SCALAR", name: "String", ofType: null }
                        },
                        defaultValue: null
                    },
                    {
                        name: "draft",
                        description: "Whether to create as draft.",
                        type: { kind: "SCALAR", name: "Boolean", ofType: null },
                        defaultValue: "true"
                    }
                ],
                enumValues: null,
                interfaces: null,
                possibleTypes: null
            },
            {
                name: "PostStatus",
                kind: "ENUM",
                description: "Status of a post.",
                fields: null,
                inputFields: null,
                enumValues: [
                    { name: "DRAFT", description: "Not yet published." },
                    { name: "PUBLISHED", description: "Visible to readers." },
                    { name: "ARCHIVED", description: null }
                ],
                interfaces: null,
                possibleTypes: null
            },
            {
                name: "String",
                kind: "SCALAR",
                description: "Built-in string.",
                fields: null,
                inputFields: null,
                enumValues: null,
                interfaces: null,
                possibleTypes: null
            },
            {
                name: "Boolean",
                kind: "SCALAR",
                description: null,
                fields: null,
                inputFields: null,
                enumValues: null,
                interfaces: null,
                possibleTypes: null
            },
            {
                name: "ID",
                kind: "SCALAR",
                description: null,
                fields: null,
                inputFields: null,
                enumValues: null,
                interfaces: null,
                possibleTypes: null
            },
            {
                name: "__Schema",
                kind: "OBJECT",
                description: "Introspection type.",
                fields: [],
                inputFields: null,
                enumValues: null,
                interfaces: [],
                possibleTypes: null
            }
        ]
    };
}

describe("DocsExplorerPresenter", () => {
    let presenter: IDocsExplorerPresenter;

    beforeEach(() => {
        presenter = createPresenter();
    });

    describe("toggle", () => {
        it("should open and close the drawer", () => {
            expect(presenter.vm.open).toBe(false);
            presenter.toggle();
            expect(presenter.vm.open).toBe(true);
            presenter.toggle();
            expect(presenter.vm.open).toBe(false);
        });
    });

    describe("schemaStatus", () => {
        it("should be idle by default", () => {
            expect(presenter.vm.schemaStatus).toBe("idle");
        });

        it("should reflect loading status", () => {
            presenter.setSchema(null, "loading");
            expect(presenter.vm.schemaStatus).toBe("loading");
        });

        it("should reflect ready status", () => {
            presenter.setSchema(createSchema(), "ready");
            expect(presenter.vm.schemaStatus).toBe("ready");
        });
    });

    describe("setSchema", () => {
        it("should produce a root view with sections for Query and Mutation", () => {
            presenter.setSchema(createSchema(), "ready");
            const view = presenter.vm.currentView;
            expect(view).not.toBeNull();
            expect(view!.kind).toBe("root");

            const rootView = view as IDocsExplorerPresenter["vm"]["currentView"] & {
                kind: "root";
            };
            const sectionNames = rootView.sections.map(s => s.name);
            expect(sectionNames).toEqual(["Query", "Mutation"]);
        });

        it("should list fields in Query section", () => {
            presenter.setSchema(createSchema(), "ready");
            const rootView = presenter.vm.currentView as any;
            const querySection = rootView.sections.find((s: any) => s.name === "Query");
            const fieldNames = querySection.fields.map((f: any) => f.name);
            expect(fieldNames).toEqual(["user", "posts"]);
        });

        it("should exclude built-in types (starting with __)", () => {
            presenter.setSchema(createSchema(), "ready");
            const rootView = presenter.vm.currentView as any;
            const typeNames = rootView.filteredTypes.map((t: any) => t.name);
            expect(typeNames).not.toContain("__Schema");
        });

        it("should produce null currentView when schema is null", () => {
            presenter.setSchema(null, "idle");
            expect(presenter.vm.currentView).toBeNull();
        });

        it("should reset navigation and search when schema changes", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("User");
            presenter.setSearchQuery("Post");

            presenter.setSchema(createSchema(), "ready");

            expect(presenter.vm.breadcrumbs).toEqual([]);
            expect(presenter.vm.searchQuery).toBe("");
            expect(presenter.vm.currentView!.kind).toBe("root");
        });
    });

    describe("navigation", () => {
        it("should navigate to a type and show it in breadcrumbs", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("User");

            expect(presenter.vm.breadcrumbs).toEqual(["User"]);
            expect(presenter.vm.currentView!.kind).toBe("type");
            const typeView = presenter.vm.currentView as any;
            expect(typeView.name).toBe("User");
            expect(typeView.typeKind).toBe("OBJECT");
        });

        it("should show fields with correct type refs", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("User");

            const typeView = presenter.vm.currentView as any;
            const idField = typeView.fields.find((f: any) => f.name === "id");
            expect(idField.type.displayName).toBe("ID!");
            expect(idField.type.isNavigable).toBe(false);

            const nameField = typeView.fields.find((f: any) => f.name === "name");
            expect(nameField.type.displayName).toBe("String");
            expect(nameField.type.isNavigable).toBe(false);
        });

        it("should handle nested wrapping types like [Post!]!", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("Query");

            const typeView = presenter.vm.currentView as any;
            const postsField = typeView.fields.find((f: any) => f.name === "posts");
            expect(postsField.type.displayName).toBe("[Post!]!");
            expect(postsField.type.name).toBe("Post");
            expect(postsField.type.isNavigable).toBe(true);
        });

        it("should navigate back", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("User");
            presenter.navigateToType("Post");

            expect(presenter.vm.breadcrumbs).toEqual(["User", "Post"]);

            presenter.navigateBack();
            expect(presenter.vm.breadcrumbs).toEqual(["User"]);
            expect((presenter.vm.currentView as any).name).toBe("User");

            presenter.navigateBack();
            expect(presenter.vm.breadcrumbs).toEqual([]);
            expect(presenter.vm.currentView!.kind).toBe("root");
        });

        it("should navigate to root directly", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("User");
            presenter.navigateToType("Post");

            presenter.navigateToRoot();

            expect(presenter.vm.breadcrumbs).toEqual([]);
            expect(presenter.vm.currentView!.kind).toBe("root");
        });

        it("should deduplicate cyclic navigation by popping back", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("User");
            presenter.navigateToType("Post");
            presenter.navigateToType("User");

            expect(presenter.vm.breadcrumbs).toEqual(["User"]);
            expect((presenter.vm.currentView as any).name).toBe("User");
        });

        it("should ignore navigation to unknown types", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("NonExistent");

            expect(presenter.vm.breadcrumbs).toEqual([]);
            expect(presenter.vm.currentView!.kind).toBe("root");
        });
    });

    describe("INPUT_OBJECT types", () => {
        it("should expose inputFields instead of fields", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("CreatePostInput");

            const typeView = presenter.vm.currentView as any;
            expect(typeView.typeKind).toBe("INPUT_OBJECT");
            expect(typeView.fields).toEqual([]);
            expect(typeView.inputFields).toHaveLength(2);

            const titleField = typeView.inputFields.find((f: any) => f.name === "title");
            expect(titleField.type.displayName).toBe("String!");
            expect(titleField.defaultValue).toBeNull();

            const draftField = typeView.inputFields.find((f: any) => f.name === "draft");
            expect(draftField.defaultValue).toBe("true");
        });
    });

    describe("ENUM types", () => {
        it("should expose enum values with descriptions", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.navigateToType("PostStatus");

            const typeView = presenter.vm.currentView as any;
            expect(typeView.typeKind).toBe("ENUM");
            expect(typeView.enumValues).toEqual([
                { name: "DRAFT", description: "Not yet published." },
                { name: "PUBLISHED", description: "Visible to readers." },
                { name: "ARCHIVED", description: null }
            ]);
        });
    });

    describe("search", () => {
        it("should filter types by name (case-insensitive)", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.setSearchQuery("post");

            const rootView = presenter.vm.currentView as any;
            const names = rootView.filteredTypes.map((t: any) => t.name);
            expect(names).toContain("Post");
            expect(names).toContain("PostStatus");
            expect(names).toContain("CreatePostInput");
            expect(names).not.toContain("User");
        });

        it("should show all types when search is empty", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.setSearchQuery("post");
            presenter.setSearchQuery("");

            const rootView = presenter.vm.currentView as any;
            expect(rootView.filteredTypes.length).toBeGreaterThan(3);
        });

        it("should clear search when navigating to a type", () => {
            presenter.setSchema(createSchema(), "ready");
            presenter.setSearchQuery("post");
            presenter.navigateToType("Post");

            expect(presenter.vm.searchQuery).toBe("");
        });
    });

    describe("type navigability", () => {
        it("should mark scalars as not navigable", () => {
            presenter.setSchema(createSchema(), "ready");

            const rootView = presenter.vm.currentView as any;
            const stringType = rootView.filteredTypes.find((t: any) => t.name === "String");
            expect(stringType.isNavigable).toBe(false);
        });

        it("should mark objects as navigable", () => {
            presenter.setSchema(createSchema(), "ready");

            const rootView = presenter.vm.currentView as any;
            const userType = rootView.filteredTypes.find((t: any) => t.name === "User");
            expect(userType.isNavigable).toBe(true);
        });

        it("should mark enums as navigable", () => {
            presenter.setSchema(createSchema(), "ready");

            const rootView = presenter.vm.currentView as any;
            const enumType = rootView.filteredTypes.find((t: any) => t.name === "PostStatus");
            expect(enumType.isNavigable).toBe(true);
        });
    });
});
