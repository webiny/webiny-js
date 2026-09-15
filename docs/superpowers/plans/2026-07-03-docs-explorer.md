# Docs Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schema documentation explorer sidebar to the GraphQL Playground, letting users browse types, fields, args, and enums from the introspected schema.

**Architecture:** A new `DocsExplorerPresenter` (MobX, DI abstraction) transforms the raw `__schema` introspection JSON into a navigable tree. It is decoupled from `PlaygroundPresenter` — `PlaygroundPage` bridges them by passing `vm.schema` + `vm.schemaStatus` via a `useEffect`. The UI is a right-side `Drawer` from `@webiny/admin-ui`.

**Tech Stack:** TypeScript, MobX, React, Vitest, `@webiny/admin-ui` Drawer, `@webiny/feature/admin` DI.

## Global Constraints

- ES modules only (no CommonJS/require).
- One named import per line.
- No `export default` — always named exports.
- No `React.FC` — plain arrow functions with typed props.
- No `??` or `??=` — use `||` and explicit if-checks.
- No conditional JSX with `&&` — extract to own component.
- Comments end with period; `//` single-line, `/* */` multi-line.
- Class properties always have `public`/`protected`/`private` + `readonly` where applicable.
- `import React from "react"` required in all JSX/TSX files.
- Event params use `ev` minimum, no single-letter names.
- One abstraction per file when there are multiple; flat `abstractions.ts` when there is one.

---

### Task 1: Expose `schemaStatus` on PlaygroundPresenter

Add `schemaStatus` to `IPlaygroundVm` so downstream consumers can distinguish idle/loading/ready.

**Files:**
- Modify: `packages/app-graphql-playground/src/presentation/Playground/abstractions.ts`
- Modify: `packages/app-graphql-playground/src/presentation/Playground/PlaygroundPresenter.ts`
- Test: `packages/app-graphql-playground/__tests__/PlaygroundPresenter.test.ts`

**Interfaces:**
- Consumes: existing `IPlaygroundVm`, `PlaygroundPresenterImpl` internals (`pendingIntrospections`, `schemas`)
- Produces: `IPlaygroundVm.schemaStatus: "idle" | "loading" | "ready"` — used by Task 6 (PlaygroundPage wiring)

- [ ] **Step 1: Write the failing test**

Add to `__tests__/PlaygroundPresenter.test.ts`:

```ts
describe("schemaStatus", () => {
    it("should be idle before init", () => {
        const presenter = createPresenter({
            registry: mockRegistry,
            repository: mockRepository
        });

        expect(presenter.vm.schemaStatus).toBe("idle");
    });

    it("should be loading while introspection is in flight", () => {
        let resolveIntrospection: (value: any) => void;
        const pendingClient: PlaygroundClient.Interface = {
            execute: vi.fn().mockImplementation(() => {
                return new Promise(resolve => {
                    resolveIntrospection = resolve;
                });
            })
        };
        const registry = createMockRegistry(pendingClient);
        const presenter = createPresenter({
            registry,
            repository: mockRepository
        });

        presenter.init();

        expect(presenter.vm.schemaStatus).toBe("loading");
    });

    it("should be ready after introspection completes", async () => {
        const schemaResponse = {
            data: {
                __schema: {
                    queryType: { name: "Query" },
                    mutationType: null,
                    subscriptionType: null,
                    types: [
                        { name: "Query", kind: "OBJECT", fields: [], description: null, inputFields: null, enumValues: null, interfaces: [], possibleTypes: null }
                    ]
                }
            }
        };
        const client = createMockClient(schemaResponse);
        const registry = createMockRegistry(client);
        const presenter = createPresenter({
            registry,
            repository: mockRepository
        });

        presenter.init();
        await vi.runAllTimersAsync();

        expect(presenter.vm.schemaStatus).toBe("ready");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/app-graphql-playground 2>&1 | tail -30`
Expected: FAIL — `schemaStatus` does not exist on `vm`.

- [ ] **Step 3: Add `schemaStatus` to `IPlaygroundVm`**

In `packages/app-graphql-playground/src/presentation/Playground/abstractions.ts`, add to `IPlaygroundVm`:

```ts
export type ISchemaStatus = "idle" | "loading" | "ready";
```

Add the field to `IPlaygroundVm`:

```ts
schemaStatus: ISchemaStatus;
```

Add to the `PlaygroundPresenter` namespace:

```ts
export type SchemaStatus = ISchemaStatus;
```

- [ ] **Step 4: Implement `schemaStatus` getter in `PlaygroundPresenterImpl`**

In `packages/app-graphql-playground/src/presentation/Playground/PlaygroundPresenter.ts`, update the `vm` getter:

```ts
public get vm(): PlaygroundPresenter.Vm {
    const activeTab = this.getActiveTab();

    return {
        tabs: this.tabs,
        activeTabId: this.activeTabId,
        activeTab: activeTab,
        endpoints: this.endpoints,
        schema: this.getActiveSchema(),
        schemaStatus: this.getSchemaStatus()
    };
}
```

Add the private method:

```ts
private getSchemaStatus(): PlaygroundPresenter.SchemaStatus {
    const tab = this.getActiveTab();
    if (!tab) {
        return "idle";
    }

    if (this.schemas.has(tab.endpoint)) {
        return "ready";
    }

    if (this.pendingIntrospections.has(tab.endpoint)) {
        return "loading";
    }

    return "idle";
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test packages/app-graphql-playground 2>&1 | tail -30`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/app-graphql-playground/src/presentation/Playground/abstractions.ts \
       packages/app-graphql-playground/src/presentation/Playground/PlaygroundPresenter.ts \
       packages/app-graphql-playground/__tests__/PlaygroundPresenter.test.ts
git commit -m "feat(app-graphql-playground): expose schemaStatus on PlaygroundPresenter vm"
```

---

### Task 2: DocsExplorerPresenter abstraction + types

Create the abstraction file with all VM interfaces and the DI token.

**Files:**
- Create: `packages/app-graphql-playground/src/presentation/DocsExplorer/abstractions.ts`

**Interfaces:**
- Consumes: `createAbstraction` from `@webiny/feature/admin`
- Produces: `DocsExplorerPresenter` abstraction token, all `IDocs*` interfaces — used by Tasks 3–7

- [ ] **Step 1: Create abstractions file**

Create `packages/app-graphql-playground/src/presentation/DocsExplorer/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";

export type IDocsGraphQLTypeKind =
    | "OBJECT"
    | "INPUT_OBJECT"
    | "ENUM"
    | "UNION"
    | "INTERFACE"
    | "SCALAR";

export type IDocsSchemaStatus = "idle" | "loading" | "ready";

export interface IDocsTypeRef {
    name: string;
    displayName: string;
    isNavigable: boolean;
}

export interface IDocsArgVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    defaultValue: string | null;
}

export interface IDocsFieldVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    args: IDocsArgVm[];
}

export interface IDocsInputFieldVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    defaultValue: string | null;
}

export interface IDocsEnumValueVm {
    name: string;
    description: string | null;
}

export interface IDocsTypeSummary {
    name: string;
    typeKind: IDocsGraphQLTypeKind;
    description: string | null;
    isNavigable: boolean;
}

export interface IDocsRootSection {
    name: string;
    fields: IDocsFieldVm[];
}

export interface IDocsRootView {
    kind: "root";
    sections: IDocsRootSection[];
    filteredTypes: IDocsTypeSummary[];
}

export interface IDocsTypeView {
    kind: "type";
    name: string;
    description: string | null;
    typeKind: IDocsGraphQLTypeKind;
    fields: IDocsFieldVm[];
    inputFields: IDocsInputFieldVm[];
    enumValues: IDocsEnumValueVm[];
    possibleTypes: IDocsTypeRef[];
    interfaces: IDocsTypeRef[];
}

export interface IDocsExplorerVm {
    open: boolean;
    schemaStatus: IDocsSchemaStatus;
    searchQuery: string;
    breadcrumbs: string[];
    currentView: IDocsRootView | IDocsTypeView | null;
}

export interface IDocsExplorerPresenter {
    readonly vm: IDocsExplorerVm;
    toggle(): void;
    setSchema(schema: Record<string, any> | null, status: IDocsSchemaStatus): void;
    navigateToType(name: string): void;
    navigateBack(): void;
    navigateToRoot(): void;
    setSearchQuery(query: string): void;
}

export const DocsExplorerPresenter =
    createAbstraction<IDocsExplorerPresenter>("DocsExplorerPresenter");

export namespace DocsExplorerPresenter {
    export type Interface = IDocsExplorerPresenter;
    export type Vm = IDocsExplorerVm;
    export type RootView = IDocsRootView;
    export type TypeView = IDocsTypeView;
    export type RootSection = IDocsRootSection;
    export type TypeSummary = IDocsTypeSummary;
    export type TypeRef = IDocsTypeRef;
    export type FieldVm = IDocsFieldVm;
    export type InputFieldVm = IDocsInputFieldVm;
    export type ArgVm = IDocsArgVm;
    export type EnumValueVm = IDocsEnumValueVm;
    export type GraphQLTypeKind = IDocsGraphQLTypeKind;
    export type SchemaStatus = IDocsSchemaStatus;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/app-graphql-playground/src/presentation/DocsExplorer/abstractions.ts
git commit -m "feat(app-graphql-playground): add DocsExplorerPresenter abstraction and vm types"
```

---

### Task 3: DocsExplorerPresenter implementation + tests

Implement the presenter with full test coverage. This is the core logic — schema parsing, navigation, search.

**Files:**
- Create: `packages/app-graphql-playground/src/presentation/DocsExplorer/DocsExplorerPresenter.ts`
- Create: `packages/app-graphql-playground/__tests__/DocsExplorerPresenter.test.ts`

**Interfaces:**
- Consumes: all `IDocs*` types from Task 2 `abstractions.ts`
- Produces: `DefaultDocsExplorerPresenter` — used by Task 4 (feature wiring)

- [ ] **Step 1: Create a test helper with a realistic introspection schema**

Create `packages/app-graphql-playground/__tests__/DocsExplorerPresenter.test.ts` with the test fixture:

```ts
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
                                type: { kind: "NON_NULL", name: null, ofType: { kind: "SCALAR", name: "ID", ofType: null } },
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
                                type: { kind: "NON_NULL", name: null, ofType: { kind: "INPUT_OBJECT", name: "CreatePostInput", ofType: null } },
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
                        type: { kind: "NON_NULL", name: null, ofType: { kind: "SCALAR", name: "ID", ofType: null } },
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
                        type: { kind: "NON_NULL", name: null, ofType: { kind: "SCALAR", name: "ID", ofType: null } },
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
                        type: { kind: "NON_NULL", name: null, ofType: { kind: "SCALAR", name: "String", ofType: null } },
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
```

- [ ] **Step 2: Write core tests**

Append to the same file:

```ts
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

            const rootView = view as IDocsExplorerPresenter["vm"]["currentView"] & { kind: "root" };
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn test packages/app-graphql-playground -- --testPathPattern=DocsExplorer 2>&1 | tail -30`
Expected: FAIL — `DocsExplorerPresenter` module not found.

- [ ] **Step 4: Implement `DocsExplorerPresenterImpl`**

Create `packages/app-graphql-playground/src/presentation/DocsExplorer/DocsExplorerPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import type {
    IDocsExplorerPresenter,
    IDocsExplorerVm,
    IDocsRootView,
    IDocsTypeView,
    IDocsRootSection,
    IDocsTypeSummary,
    IDocsFieldVm,
    IDocsInputFieldVm,
    IDocsArgVm,
    IDocsEnumValueVm,
    IDocsTypeRef,
    IDocsGraphQLTypeKind,
    IDocsSchemaStatus
} from "./abstractions.js";
import { DocsExplorerPresenter } from "./abstractions.js";

interface IIntrospectionType {
    name: string;
    kind: string;
    description: string | null;
    fields: any[] | null;
    inputFields: any[] | null;
    enumValues: any[] | null;
    interfaces: any[] | null;
    possibleTypes: any[] | null;
}

const NON_NAVIGABLE_KINDS = new Set(["SCALAR"]);

class DocsExplorerPresenterImpl implements IDocsExplorerPresenter {
    private isOpen = false;
    private status: IDocsSchemaStatus = "idle";
    private search = "";
    private navigationStack: string[] = [];
    private typeMap = new Map<string, IIntrospectionType>();
    private rootTypeNames: string[] = [];

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    public get vm(): IDocsExplorerVm {
        return {
            open: this.isOpen,
            schemaStatus: this.status,
            searchQuery: this.search,
            breadcrumbs: [...this.navigationStack],
            currentView: this.buildCurrentView()
        };
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;
    }

    public setSchema(
        schema: Record<string, any> | null,
        status: IDocsSchemaStatus
    ): void {
        this.status = status;
        this.navigationStack = [];
        this.search = "";
        this.typeMap.clear();
        this.rootTypeNames = [];

        if (!schema) {
            return;
        }

        const types: any[] = schema.types || [];
        for (const type of types) {
            if (type.name.startsWith("__")) {
                continue;
            }
            this.typeMap.set(type.name, {
                name: type.name,
                kind: type.kind,
                description: type.description || null,
                fields: type.fields || [],
                inputFields: type.inputFields || [],
                enumValues: type.enumValues || [],
                interfaces: type.interfaces || [],
                possibleTypes: type.possibleTypes || []
            });
        }

        if (schema.queryType) {
            this.rootTypeNames.push(schema.queryType.name);
        }
        if (schema.mutationType) {
            this.rootTypeNames.push(schema.mutationType.name);
        }
        if (schema.subscriptionType) {
            this.rootTypeNames.push(schema.subscriptionType.name);
        }
    }

    public navigateToType(name: string): void {
        if (!this.typeMap.has(name)) {
            return;
        }

        const type = this.typeMap.get(name)!;
        if (NON_NAVIGABLE_KINDS.has(type.kind)) {
            return;
        }

        const existingIndex = this.navigationStack.indexOf(name);
        if (existingIndex !== -1) {
            this.navigationStack = this.navigationStack.slice(0, existingIndex + 1);
        } else {
            this.navigationStack.push(name);
        }

        this.search = "";
    }

    public navigateBack(): void {
        if (this.navigationStack.length === 0) {
            return;
        }

        this.navigationStack.pop();
    }

    public navigateToRoot(): void {
        this.navigationStack = [];
    }

    public setSearchQuery(query: string): void {
        this.search = query;
    }

    private buildCurrentView(): IDocsRootView | IDocsTypeView | null {
        if (this.typeMap.size === 0) {
            return null;
        }

        if (this.navigationStack.length === 0) {
            return this.buildRootView();
        }

        const typeName = this.navigationStack[this.navigationStack.length - 1];
        const type = this.typeMap.get(typeName);
        if (!type) {
            return this.buildRootView();
        }

        return this.buildTypeView(type);
    }

    private buildRootView(): IDocsRootView {
        const sections: IDocsRootSection[] = [];

        for (const rootName of this.rootTypeNames) {
            const rootType = this.typeMap.get(rootName);
            if (!rootType) {
                continue;
            }

            sections.push({
                name: rootName,
                fields: this.mapFields(rootType.fields || [])
            });
        }

        const allTypes = Array.from(this.typeMap.values());
        const lowerSearch = this.search.toLowerCase();

        const filteredTypes: IDocsTypeSummary[] = allTypes
            .filter(type => {
                if (this.search === "") {
                    return true;
                }
                return type.name.toLowerCase().includes(lowerSearch);
            })
            .map(type => ({
                name: type.name,
                typeKind: type.kind as IDocsGraphQLTypeKind,
                description: type.description,
                isNavigable: !NON_NAVIGABLE_KINDS.has(type.kind)
            }));

        return {
            kind: "root",
            sections,
            filteredTypes
        };
    }

    private buildTypeView(type: IIntrospectionType): IDocsTypeView {
        return {
            kind: "type",
            name: type.name,
            description: type.description,
            typeKind: type.kind as IDocsGraphQLTypeKind,
            fields: this.mapFields(type.fields || []),
            inputFields: this.mapInputFields(type.inputFields || []),
            enumValues: this.mapEnumValues(type.enumValues || []),
            possibleTypes: (type.possibleTypes || []).map((t: any) => this.buildTypeRef(t)),
            interfaces: (type.interfaces || []).map((t: any) => this.buildTypeRef(t))
        };
    }

    private mapFields(fields: any[]): IDocsFieldVm[] {
        return fields.map(field => ({
            name: field.name,
            description: field.description || null,
            type: this.buildTypeRef(field.type),
            args: this.mapArgs(field.args || [])
        }));
    }

    private mapArgs(args: any[]): IDocsArgVm[] {
        return args.map(arg => ({
            name: arg.name,
            description: arg.description || null,
            type: this.buildTypeRef(arg.type),
            defaultValue: arg.defaultValue || null
        }));
    }

    private mapInputFields(fields: any[]): IDocsInputFieldVm[] {
        return fields.map(field => ({
            name: field.name,
            description: field.description || null,
            type: this.buildTypeRef(field.type),
            defaultValue: field.defaultValue || null
        }));
    }

    private mapEnumValues(values: any[]): IDocsEnumValueVm[] {
        return values.map(value => ({
            name: value.name,
            description: value.description || null
        }));
    }

    private buildTypeRef(introspectionType: any): IDocsTypeRef {
        const { name, displayName } = this.unwrapType(introspectionType);
        const resolved = this.typeMap.get(name);
        const isNavigable = resolved ? !NON_NAVIGABLE_KINDS.has(resolved.kind) : false;

        return { name, displayName, isNavigable };
    }

    private unwrapType(type: any): { name: string; displayName: string } {
        if (type.kind === "NON_NULL") {
            const inner = this.unwrapType(type.ofType);
            return {
                name: inner.name,
                displayName: `${inner.displayName}!`
            };
        }

        if (type.kind === "LIST") {
            const inner = this.unwrapType(type.ofType);
            return {
                name: inner.name,
                displayName: `[${inner.displayName}]`
            };
        }

        return {
            name: type.name,
            displayName: type.name
        };
    }
}

export const DefaultDocsExplorerPresenter = DocsExplorerPresenter.createImplementation({
    implementation: DocsExplorerPresenterImpl,
    dependencies: []
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test packages/app-graphql-playground -- --testPathPattern=DocsExplorer 2>&1 | tail -30`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/app-graphql-playground/src/presentation/DocsExplorer/DocsExplorerPresenter.ts \
       packages/app-graphql-playground/__tests__/DocsExplorerPresenter.test.ts
git commit -m "feat(app-graphql-playground): implement DocsExplorerPresenter with tests"
```

---

### Task 4: DI feature wiring + index re-export

Wire the presenter into the DI container and create the index re-export.

**Files:**
- Create: `packages/app-graphql-playground/src/presentation/DocsExplorer/feature.ts`
- Create: `packages/app-graphql-playground/src/presentation/DocsExplorer/index.ts`
- Modify: `packages/app-graphql-playground/src/index.tsx`

**Interfaces:**
- Consumes: `DocsExplorerPresenter` abstraction (Task 2), `DefaultDocsExplorerPresenter` (Task 3)
- Produces: `DocsExplorerFeature` — used by Task 6 (`PlaygroundPage` resolves it)

- [ ] **Step 1: Create feature.ts**

Create `packages/app-graphql-playground/src/presentation/DocsExplorer/feature.ts`:

```ts
import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { DocsExplorerPresenter } from "./abstractions.js";
import { DefaultDocsExplorerPresenter } from "./DocsExplorerPresenter.js";

export const DocsExplorerFeature = createFeature({
    name: "DocsExplorerPresenter",
    register(container) {
        container.register(DefaultDocsExplorerPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(DocsExplorerPresenter)
        };
    }
});
```

- [ ] **Step 2: Create index.ts**

Create `packages/app-graphql-playground/src/presentation/DocsExplorer/index.ts`:

```ts
export { DocsExplorerPresenter } from "./abstractions.js";
export { DocsExplorerFeature } from "./feature.js";
```

- [ ] **Step 3: Register the feature in the root component**

In `packages/app-graphql-playground/src/index.tsx`, add the import (one per line):

```ts
import { DocsExplorerFeature } from "./presentation/DocsExplorer/feature.js";
```

Add a `<RegisterFeature>` inside `GraphQLPlaygroundExtension`, after the existing features:

```tsx
<RegisterFeature feature={DocsExplorerFeature} />
```

- [ ] **Step 4: Commit**

```bash
git add packages/app-graphql-playground/src/presentation/DocsExplorer/feature.ts \
       packages/app-graphql-playground/src/presentation/DocsExplorer/index.ts \
       packages/app-graphql-playground/src/index.tsx
git commit -m "feat(app-graphql-playground): wire DocsExplorerFeature into DI container"
```

---

### Task 5: DocsExplorer UI components

Build all four React components for the docs explorer drawer.

**Files:**
- Create: `packages/app-graphql-playground/src/presentation/DocsExplorer/components/DocsTypeRef.tsx`
- Create: `packages/app-graphql-playground/src/presentation/DocsExplorer/components/DocsTypeView.tsx`
- Create: `packages/app-graphql-playground/src/presentation/DocsExplorer/components/DocsRootView.tsx`
- Create: `packages/app-graphql-playground/src/presentation/DocsExplorer/components/DocsExplorerDrawer.tsx`

**Interfaces:**
- Consumes: `DocsExplorerPresenter.Interface` (Task 2), all VM types
- Produces: `DocsExplorerDrawer` component — used by Task 6 (`PlaygroundPage` renders it)

- [ ] **Step 1: Create DocsTypeRef**

Create `packages/app-graphql-playground/src/presentation/DocsExplorer/components/DocsTypeRef.tsx`:

```tsx
import React from "react";
import type { DocsExplorerPresenter } from "../abstractions.js";

interface DocsTypeRefProps {
    typeRef: DocsExplorerPresenter.TypeRef;
    presenter: DocsExplorerPresenter.Interface;
}

export const DocsTypeRef = (props: DocsTypeRefProps) => {
    if (!props.typeRef.isNavigable) {
        return <span className="text-green-700">{props.typeRef.displayName}</span>;
    }

    return (
        <button
            className="text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit"
            onClick={() => props.presenter.navigateToType(props.typeRef.name)}
        >
            {props.typeRef.displayName}
        </button>
    );
};
```

- [ ] **Step 2: Create DocsTypeView**

Create `packages/app-graphql-playground/src/presentation/DocsExplorer/components/DocsTypeView.tsx`:

```tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { DocsTypeRef } from "./DocsTypeRef.js";
import type { DocsExplorerPresenter } from "../abstractions.js";

interface DocsTypeViewProps {
    presenter: DocsExplorerPresenter.Interface;
    typeView: DocsExplorerPresenter.TypeView;
}

const KindBadge = (props: { kind: string }) => {
    return (
        <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700 ml-2">
            {props.kind}
        </span>
    );
};

const FieldArgs = (props: { args: DocsExplorerPresenter.ArgVm[]; presenter: DocsExplorerPresenter.Interface }) => {
    if (props.args.length === 0) {
        return null;
    }

    return (
        <div className="ml-4 mt-1 text-sm text-gray-600">
            {props.args.map(arg => (
                <div key={arg.name} className="flex gap-1 items-baseline">
                    <span className="text-purple-700">{arg.name}</span>
                    <span>:</span>
                    <DocsTypeRef typeRef={arg.type} presenter={props.presenter} />
                    {arg.defaultValue ? (
                        <span className="text-gray-400"> = {arg.defaultValue}</span>
                    ) : null}
                </div>
            ))}
        </div>
    );
};

const ObjectFields = (props: { fields: DocsExplorerPresenter.FieldVm[]; presenter: DocsExplorerPresenter.Interface }) => {
    if (props.fields.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Fields</h4>
            {props.fields.map(field => (
                <div key={field.name} className="mb-3 border-b border-gray-100 pb-2">
                    <div className="flex gap-1 items-baseline">
                        <span className="font-mono font-bold text-sm">{field.name}</span>
                        <span>:</span>
                        <DocsTypeRef typeRef={field.type} presenter={props.presenter} />
                    </div>
                    {field.description ? (
                        <p className="text-sm text-gray-500 mt-0.5">{field.description}</p>
                    ) : null}
                    <FieldArgs args={field.args} presenter={props.presenter} />
                </div>
            ))}
        </div>
    );
};

const InputFields = (props: { fields: DocsExplorerPresenter.InputFieldVm[]; presenter: DocsExplorerPresenter.Interface }) => {
    if (props.fields.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Input Fields</h4>
            {props.fields.map(field => (
                <div key={field.name} className="mb-3 border-b border-gray-100 pb-2">
                    <div className="flex gap-1 items-baseline">
                        <span className="font-mono font-bold text-sm">{field.name}</span>
                        <span>:</span>
                        <DocsTypeRef typeRef={field.type} presenter={props.presenter} />
                        {field.defaultValue ? (
                            <span className="text-gray-400"> = {field.defaultValue}</span>
                        ) : null}
                    </div>
                    {field.description ? (
                        <p className="text-sm text-gray-500 mt-0.5">{field.description}</p>
                    ) : null}
                </div>
            ))}
        </div>
    );
};

const EnumValues = (props: { values: DocsExplorerPresenter.EnumValueVm[] }) => {
    if (props.values.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Values</h4>
            {props.values.map(value => (
                <div key={value.name} className="mb-2">
                    <span className="font-mono text-sm font-bold">{value.name}</span>
                    {value.description ? (
                        <p className="text-sm text-gray-500 mt-0.5">{value.description}</p>
                    ) : null}
                </div>
            ))}
        </div>
    );
};

const PossibleTypes = (props: { types: DocsExplorerPresenter.TypeRef[]; presenter: DocsExplorerPresenter.Interface }) => {
    if (props.types.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Possible Types</h4>
            <div className="flex flex-wrap gap-2">
                {props.types.map(typeRef => (
                    <DocsTypeRef key={typeRef.name} typeRef={typeRef} presenter={props.presenter} />
                ))}
            </div>
        </div>
    );
};

const Interfaces = (props: { types: DocsExplorerPresenter.TypeRef[]; presenter: DocsExplorerPresenter.Interface }) => {
    if (props.types.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Implements</h4>
            <div className="flex flex-wrap gap-2">
                {props.types.map(typeRef => (
                    <DocsTypeRef key={typeRef.name} typeRef={typeRef} presenter={props.presenter} />
                ))}
            </div>
        </div>
    );
};

export const DocsTypeView = observer((props: DocsTypeViewProps) => {
    const { typeView, presenter } = props;

    return (
        <div className="p-4">
            <div className="flex items-baseline mb-2">
                <h3 className="text-lg font-bold">{typeView.name}</h3>
                <KindBadge kind={typeView.typeKind} />
            </div>
            {typeView.description ? (
                <p className="text-sm text-gray-600 mb-3">{typeView.description}</p>
            ) : null}
            <ObjectFields fields={typeView.fields} presenter={presenter} />
            <InputFields fields={typeView.inputFields} presenter={presenter} />
            <EnumValues values={typeView.enumValues} />
            <PossibleTypes types={typeView.possibleTypes} presenter={presenter} />
            <Interfaces types={typeView.interfaces} presenter={presenter} />
        </div>
    );
});
```

- [ ] **Step 3: Create DocsRootView**

Create `packages/app-graphql-playground/src/presentation/DocsExplorer/components/DocsRootView.tsx`:

```tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { DocsTypeRef } from "./DocsTypeRef.js";
import type { DocsExplorerPresenter } from "../abstractions.js";

interface DocsRootViewProps {
    presenter: DocsExplorerPresenter.Interface;
    rootView: DocsExplorerPresenter.RootView;
}

const SearchInput = (props: { value: string; presenter: DocsExplorerPresenter.Interface }) => {
    return (
        <div className="p-3 border-b border-gray-200">
            <input
                type="text"
                placeholder="Search types..."
                value={props.value}
                onChange={ev => props.presenter.setSearchQuery(ev.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
        </div>
    );
};

const RootSections = (props: { sections: DocsExplorerPresenter.RootSection[]; presenter: DocsExplorerPresenter.Interface }) => {
    return (
        <>
            {props.sections.map(section => (
                <div key={section.name} className="mb-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 px-4">
                        {section.name}
                    </h4>
                    {section.fields.map(field => (
                        <div
                            key={field.name}
                            className="px-4 py-1.5 hover:bg-gray-50 cursor-pointer flex gap-1 items-baseline"
                            onClick={() => props.presenter.navigateToType(field.type.name)}
                        >
                            <span className="font-mono text-sm">{field.name}</span>
                            <span className="text-gray-400">:</span>
                            <DocsTypeRef typeRef={field.type} presenter={props.presenter} />
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
};

const FilteredTypeList = (props: { types: DocsExplorerPresenter.TypeSummary[]; presenter: DocsExplorerPresenter.Interface }) => {
    if (props.types.length === 0) {
        return (
            <div className="p-4 text-sm text-gray-400 italic">No matching types.</div>
        );
    }

    return (
        <>
            {props.types.map(type => (
                <TypeSummaryRow key={type.name} type={type} presenter={props.presenter} />
            ))}
        </>
    );
};

const TypeSummaryRow = (props: { type: DocsExplorerPresenter.TypeSummary; presenter: DocsExplorerPresenter.Interface }) => {
    const handleClick = () => {
        if (props.type.isNavigable) {
            props.presenter.navigateToType(props.type.name);
        }
    };

    return (
        <div
            className={`px-4 py-1.5 flex items-baseline gap-2 ${props.type.isNavigable ? "hover:bg-gray-50 cursor-pointer" : ""}`}
            onClick={handleClick}
        >
            <span className={`font-mono text-sm ${props.type.isNavigable ? "text-blue-600" : "text-gray-700"}`}>
                {props.type.name}
            </span>
            <span className="text-xs text-gray-400">{props.type.typeKind}</span>
        </div>
    );
};

export const DocsRootView = observer((props: DocsRootViewProps) => {
    const { rootView, presenter } = props;
    const hasSearch = presenter.vm.searchQuery !== "";

    return (
        <div>
            <SearchInput value={presenter.vm.searchQuery} presenter={presenter} />
            <div className="overflow-y-auto pt-2" style={{ maxHeight: "calc(100vh - 140px)" }}>
                {hasSearch ? (
                    <FilteredTypeList types={rootView.filteredTypes} presenter={presenter} />
                ) : (
                    <>
                        <RootSections sections={rootView.sections} presenter={presenter} />
                        <div className="mt-4 mb-2 px-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                                All Types
                            </h4>
                        </div>
                        <FilteredTypeList types={rootView.filteredTypes} presenter={presenter} />
                    </>
                )}
            </div>
        </div>
    );
});
```

- [ ] **Step 4: Create DocsExplorerDrawer**

Create `packages/app-graphql-playground/src/presentation/DocsExplorer/components/DocsExplorerDrawer.tsx`:

```tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { Drawer } from "@webiny/admin-ui";
import { Loader } from "@webiny/admin-ui";
import { DocsRootView } from "./DocsRootView.js";
import { DocsTypeView } from "./DocsTypeView.js";
import type { DocsExplorerPresenter } from "../abstractions.js";

interface DocsExplorerDrawerProps {
    presenter: DocsExplorerPresenter.Interface;
}

const DrawerHeader = (props: { presenter: DocsExplorerPresenter.Interface }) => {
    const { breadcrumbs } = props.presenter.vm;

    if (breadcrumbs.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 text-sm">
            <button
                className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit"
                onClick={() => props.presenter.navigateBack()}
            >
                &larr; Back
            </button>
            <span className="text-gray-400">|</span>
            <button
                className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit"
                onClick={() => props.presenter.navigateToRoot()}
            >
                Root
            </button>
            {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                    <span className="text-gray-400">/</span>
                    <span className={index === breadcrumbs.length - 1 ? "text-gray-900 font-bold" : "text-gray-500"}>
                        {crumb}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

const DrawerBody = (props: { presenter: DocsExplorerPresenter.Interface }) => {
    const { currentView, schemaStatus } = props.presenter.vm;

    if (schemaStatus === "loading" && !currentView) {
        return (
            <div className="flex items-center justify-center gap-2 p-8 text-gray-500">
                <Loader size="sm" />
                <span>Loading schema...</span>
            </div>
        );
    }

    if (!currentView) {
        return (
            <div className="p-8 text-center text-gray-400 text-sm">
                No schema available.
            </div>
        );
    }

    if (currentView.kind === "root") {
        return <DocsRootView rootView={currentView} presenter={props.presenter} />;
    }

    return <DocsTypeView typeView={currentView} presenter={props.presenter} />;
};

export const DocsExplorerDrawer = observer((props: DocsExplorerDrawerProps) => {
    const { presenter } = props;

    return (
        <Drawer
            title="Schema Docs"
            open={presenter.vm.open}
            onOpenChange={open => {
                if (!open) {
                    presenter.toggle();
                }
            }}
            modal={false}
            bodyPadding={false}
            headerSeparator={true}
            width={380}
        >
            <DrawerHeader presenter={presenter} />
            <DrawerBody presenter={presenter} />
        </Drawer>
    );
});
```

- [ ] **Step 5: Commit**

```bash
git add packages/app-graphql-playground/src/presentation/DocsExplorer/components/
git commit -m "feat(app-graphql-playground): add DocsExplorer UI components"
```

---

### Task 6: Wire into PlaygroundPage + PlaygroundToolbar

Connect everything: add the Docs button to the toolbar, resolve the DocsExplorer feature in PlaygroundPage, and bridge the schema.

**Files:**
- Modify: `packages/app-graphql-playground/src/presentation/Playground/components/PlaygroundToolbar.tsx`
- Modify: `packages/app-graphql-playground/src/presentation/Playground/components/PlaygroundPage.tsx`

**Interfaces:**
- Consumes: `DocsExplorerPresenter.Interface` (Task 2), `DocsExplorerFeature` (Task 4), `PlaygroundPresenter.vm.schemaStatus` (Task 1)
- Produces: fully wired playground page with docs explorer

- [ ] **Step 1: Add Docs button to PlaygroundToolbar**

In `packages/app-graphql-playground/src/presentation/Playground/components/PlaygroundToolbar.tsx`:

Add imports:

```ts
import { ReactComponent as MenuBookIcon } from "@webiny/icons/menu_book.svg";
import type { DocsExplorerPresenter } from "../../DocsExplorer/abstractions.js";
```

Update the interface:

```ts
interface PlaygroundToolbarProps {
    presenter: PlaygroundPresenter.Interface;
    docsPresenter: DocsExplorerPresenter.Interface;
}
```

Add the Docs button before the Copy Response button in the right-side button group:

```tsx
<Button
    onClick={() => props.docsPresenter.toggle()}
    icon={<MenuBookIcon />}
    variant={props.docsPresenter.vm.open ? "primary" : "secondary"}
>
    Docs
</Button>
```

- [ ] **Step 2: Wire DocsExplorer into PlaygroundPage**

In `packages/app-graphql-playground/src/presentation/Playground/components/PlaygroundPage.tsx`:

Add imports:

```ts
import { DocsExplorerFeature } from "../../DocsExplorer/feature.js";
import { DocsExplorerDrawer } from "../../DocsExplorer/components/DocsExplorerDrawer.js";
```

Inside `PlaygroundPage`, resolve the docs feature:

```ts
const { presenter: docsPresenter } = useFeature(DocsExplorerFeature);
```

Add a `useEffect` to bridge the schema:

```ts
useEffect(() => {
    const schema = presenter.vm.schema;
    const status = presenter.vm.schemaStatus;
    docsPresenter.setSchema(schema, status);
}, [presenter.vm.schema, presenter.vm.schemaStatus, docsPresenter]);
```

Pass `docsPresenter` to `PlaygroundToolbar`:

```tsx
<PlaygroundToolbar presenter={presenter} docsPresenter={docsPresenter} />
```

Add `DocsExplorerDrawer` at the end of the component (after `ActiveTabContent`):

```tsx
<DocsExplorerDrawer presenter={docsPresenter} />
```

- [ ] **Step 3: Run all tests**

Run: `yarn test packages/app-graphql-playground 2>&1 | tail -30`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/app-graphql-playground/src/presentation/Playground/components/PlaygroundToolbar.tsx \
       packages/app-graphql-playground/src/presentation/Playground/components/PlaygroundPage.tsx
git commit -m "feat(app-graphql-playground): wire DocsExplorer into PlaygroundPage and toolbar"
```

---

### Task 7: Build + lint + format

Run the full pre-commit checklist and fix any issues.

**Files:**
- All files created/modified in Tasks 1–6

**Interfaces:**
- Consumes: all prior tasks
- Produces: clean, buildable, linted codebase

- [ ] **Step 1: Stage all changes**

```bash
git add .
```

- [ ] **Step 2: Run yarn to update lockfile**

```bash
yarn > /dev/null 2>&1
```

- [ ] **Step 3: Generate tsconfig files**

```bash
node scripts/generateTsConfigsInPackages.js
```

- [ ] **Step 4: Run adio**

```bash
yarn adio
```

- [ ] **Step 5: Format**

```bash
yarn format > /dev/null 2>&1
```

- [ ] **Step 6: Lint**

```bash
yarn lint
```

- [ ] **Step 7: Sync dependencies**

```bash
yarn webiny sync-dependencies
```

- [ ] **Step 8: Build the package**

```bash
yarn build -p @webiny/app-graphql-playground 2>&1 | tail -30
```

- [ ] **Step 9: Run all tests**

```bash
yarn test packages/app-graphql-playground 2>&1 | tail -50
```

- [ ] **Step 10: Stage and commit**

```bash
git add .
git commit -m "chore(app-graphql-playground): build, lint, and format DocsExplorer"
```
