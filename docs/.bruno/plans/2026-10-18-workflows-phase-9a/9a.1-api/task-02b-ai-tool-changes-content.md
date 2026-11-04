### Task 2b: AI tool `changesContent` flag

R283, R87; Q46; D167 (recorded by Task 23); Review Focus 9 (`00-shared.md`). The phase 8a and 8b Global Constraints and Rulings apply unchanged (read: never throw out of a use case (R87), one class or one public function per file, one named import per line, namespace types, comments end with a period, targeted tests, the pre-commit chain, the commit trailers). Design copy `Changes content` and the summary suffix ` · can change content` are used by Tasks 8 and 13, not here.

The AI step editor marks the tools that change the content under review. The flag belongs to the tool, so a tool author declares it once and `listAiTools` hands it to the editor.

- **`WorkflowAiTool`** (`[AWF]/features/aiTools/WorkflowAiTool/abstractions.ts`): `IWorkflowAiTool` gains `readonly changesContent?: boolean`, documented as `true` when the tool writes or updates the content under review, absent means `false`. Optional so every existing implementation (custom tools, the test tool) keeps compiling and keeps its meaning.
- **Built-in tools (decisions).** The built-in tools are not in `ai-powerups` (the contract's Files line names that package); they are `ReadTargetTool` and `UpdateTargetFieldsTool` in `api-workflows/src/features/aiTools/`, and `ai-powerups` registers no tool of its own (its `AiStepType` and `AiStepRunner` only consume the registry). Each of the two declares the flag explicitly:
  - `readTarget` (`ReadTargetTool.ts`): `changesContent = false`. It only reads the content (its comment: "Reads only; no stale check and no bypass").
  - `updateTargetFields` (`UpdateTargetFieldsTool.ts`): `changesContent = true`. It is "the only writer of the content under review" (it writes through the target editor inside the bypass).
- **`WorkflowAiToolInfo`** (`[AWF]/domain/config/types.ts`) gains `changesContent: boolean` (always present in a row).
- **`ListWorkflowAiToolsUseCase`** maps `changesContent: tool.changesContent ?? false` into every row. Nothing else of the use case changes (gate, sort, fixed failure text).
- **GraphQL**: `WorkflowsAiTool` gains `changesContent: Boolean!` after `description`. No resolver change (the use case result is returned as it is).

**Files:**
- Modify: `packages/api-workflows/src/features/aiTools/WorkflowAiTool/abstractions.ts`
- Modify: `packages/api-workflows/src/features/aiTools/ReadTargetTool/ReadTargetTool.ts`
- Modify: `packages/api-workflows/src/features/aiTools/UpdateTargetFieldsTool/UpdateTargetFieldsTool.ts`
- Modify: `packages/api-workflows/src/domain/config/types.ts`
- Modify: `packages/api-workflows/src/features/config/ListWorkflowAiTools/ListWorkflowAiToolsUseCase.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/TestWorkflowAiTool.ts`
- Modify: `packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts`
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `WorkflowAiTool` (`~/features/aiTools/WorkflowAiTool/index.js`), `WorkflowAiToolRegistryService.list()` and `.get(name)`, `READ_TARGET_TOOL_NAME`, `UPDATE_TARGET_FIELDS_TOOL_NAME`, `BUILT_IN_AI_TOOL_NAMES` (`~/features/aiTools/constants.js`), `registerTestAiTool`, `TEST_AI_TOOL_NAME` (`~tests/__helpers/TestWorkflowAiTool.js`), `withoutBuiltInAiTools` (`~tests/__helpers/withoutBuiltInAiTools.js`), `createContextHandler`, `expectOk`.
- Produces (matches the contract): `IWorkflowAiTool.changesContent?: boolean`, `WorkflowAiToolInfo.changesContent: boolean`, the GraphQL field `WorkflowsAiTool.changesContent: Boolean!` returned by `listAiTools`. Consumed by Task 5 (the tools document and DTO), Task 8 (summary suffix) and Task 13 (the `Changes content` tag).

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time).

- [ ] **Step 1: Write the failing tests**

Modify `packages/api-workflows/__tests__/__helpers/TestWorkflowAiTool.ts`: the test tool can declare the flag, and declares nothing by default (so the default is tested).

Before:

```ts
    description?: string;
    /** What `execute` answers; by default the context ids it was given, so a test can see where an id came from. */
```

After:

```ts
    description?: string;
    /** Declared on the tool as given; absent by default, which means false. */
    changesContent?: boolean;
    /** What `execute` answers; by default the context ids it was given, so a test can see where an id came from. */
```

Before:

```ts
    public readonly description: string;
    public readonly inputSchema = testAiToolInputSchema;
```

After:

```ts
    public readonly description: string;
    public readonly changesContent?: boolean;
    public readonly inputSchema = testAiToolInputSchema;
```

Before:

```ts
        this.description = overrides.description ?? "A tool for tests.";
```

After:

```ts
        this.description = overrides.description ?? "A tool for tests.";
        this.changesContent = overrides.changesContent;
```

Modify `packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts`: one case per value.

Before:

```ts
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
```

After:

```ts
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
import { READ_TARGET_TOOL_NAME } from "~/features/aiTools/constants.js";
import { UPDATE_TARGET_FIELDS_TOOL_NAME } from "~/features/aiTools/constants.js";
```

Before:

```ts
    it("keeps a custom tool next to them and lets it replace one by name (A61)", async () => {
```

After:

```ts
    it("declares changesContent: false on readTarget and true on updateTargetFields (R283)", async () => {
        const { context } = await createContextHandler();
        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        const readTarget = registry.get(READ_TARGET_TOOL_NAME);
        const updateTargetFields = registry.get(UPDATE_TARGET_FIELDS_TOOL_NAME);

        expect(readTarget?.changesContent).toBe(false);
        expect(updateTargetFields?.changesContent).toBe(true);
    });

    it("keeps a custom tool next to them and lets it replace one by name (A61)", async () => {
```

Modify `packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts`.

Before:

```ts
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
```

After:

```ts
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
import { READ_TARGET_TOOL_NAME } from "~/features/aiTools/constants.js";
import { UPDATE_TARGET_FIELDS_TOOL_NAME } from "~/features/aiTools/constants.js";
```

Before:

```ts
    it("lists name, title and description only, with no schema", async () => {
```

After:

```ts
    it("lists the built-in tools with their changesContent flag (R283)", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        const rows = expectOk(await listAiTools.execute());

        expect(rows.map(row => [row.name, row.changesContent])).toEqual([
            [READ_TARGET_TOOL_NAME, false],
            [UPDATE_TARGET_FIELDS_TOOL_NAME, true]
        ]);
    });

    it("lists a tool that declares nothing as false and a tool that declares true as true (R283)", async () => {
        const { listAiTools } = await createListContext({
            permissions: [{ name: "workflows", editor: true }],
            setup: container => {
                registerTestAiTool(container, { name: "plainTool", title: "Plain" });
                registerTestAiTool(container, {
                    name: "writerTool",
                    title: "Writer",
                    changesContent: true
                });
                registerTestAiTool(container, {
                    name: "readerTool",
                    title: "Reader",
                    changesContent: false
                });
            }
        });

        const rows = withoutBuiltInAiTools(expectOk(await listAiTools.execute()));

        expect(rows.map(row => [row.name, row.changesContent])).toEqual([
            ["plainTool", false],
            ["readerTool", false],
            ["writerTool", true]
        ]);
    });

    it("lists name, title, description and changesContent only, with no schema", async () => {
```

Before:

```ts
        expect(rows).toEqual([
            { name: TEST_AI_TOOL_NAME, title: "Test tool", description: "A tool for tests." }
        ]);
        expect(Object.keys(rows[0])).toEqual(["name", "title", "description"]);
```

After:

```ts
        expect(rows).toEqual([
            {
                name: TEST_AI_TOOL_NAME,
                title: "Test tool",
                description: "A tool for tests.",
                changesContent: false
            }
        ]);
        expect(Object.keys(rows[0])).toEqual(["name", "title", "description", "changesContent"]);
```

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`.

Before:

```ts
            listAiTools {
                data {
                    name
                    title
                    description
                }
```

After:

```ts
            listAiTools {
                data {
                    name
                    title
                    description
                    changesContent
                }
```

Before:

```ts
interface AiToolRow {
    name: string;
    title: string;
    description: string;
}
```

After:

```ts
interface AiToolRow {
    name: string;
    title: string;
    description: string;
    changesContent: boolean;
}
```

Before:

```ts
                registerTestAiTool(container, { name: "zuluTool", title: "Zulu" });
                registerTestAiTool(container, {
                    title: "Alpha",
                    description: "A tool for tests."
                });
```

After:

```ts
                registerTestAiTool(container, {
                    name: "zuluTool",
                    title: "Zulu",
                    changesContent: true
                });
                registerTestAiTool(container, {
                    title: "Alpha",
                    description: "A tool for tests."
                });
```

Before:

```ts
            { name: TEST_AI_TOOL_NAME, title: "Alpha", description: "A tool for tests." },
            { name: "zuluTool", title: "Zulu", description: "A tool for tests." }
```

After:

```ts
            {
                name: TEST_AI_TOOL_NAME,
                title: "Alpha",
                description: "A tool for tests.",
                changesContent: false
            },
            {
                name: "zuluTool",
                title: "Zulu",
                description: "A tool for tests.",
                changesContent: true
            }
```

Before:

```ts
        expect((envelope.data ?? []).map(row => row.name)).toEqual(BUILT_IN_AI_TOOL_NAMES);
```

After:

```ts
        expect((envelope.data ?? []).map(row => row.name)).toEqual(BUILT_IN_AI_TOOL_NAMES);
        expect((envelope.data ?? []).map(row => row.changesContent)).toEqual([false, true]);
```

Before:

```ts
        expect(memberNames(types, "WorkflowsAiTool")).toEqual(["name", "title", "description"]);
```

After:

```ts
        expect(memberNames(types, "WorkflowsAiTool")).toEqual([
            "name",
            "title",
            "description",
            "changesContent"
        ]);
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL. The built-in test fails (`expected undefined to be false`). The list tests fail on the missing `changesContent` (`expected [...] to deeply equal [...]`). The schema test fails because the query asks for a field `WorkflowsAiTool` does not have (`Cannot query field "changesContent" on type "WorkflowsAiTool"`) and the member list differs.

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/features/aiTools/WorkflowAiTool/abstractions.ts`.

Before:

```ts
    /** What the model sends. Never include a target, revision, review or step id: the context has them. */
    readonly inputSchema: ZodType<TInput>;
```

After:

```ts
    /**
     * Declare `true` when the tool writes or updates the content under review. The step editor
     * marks such tools and says the step can change content (R283). Absent means `false`.
     */
    readonly changesContent?: boolean;
    /** What the model sends. Never include a target, revision, review or step id: the context has them. */
    readonly inputSchema: ZodType<TInput>;
```

Modify `packages/api-workflows/src/features/aiTools/ReadTargetTool/ReadTargetTool.ts`.

Before:

```ts
    public readonly inputSchema = readTargetInputSchema;
```

After:

```ts
    public readonly changesContent = false;
    public readonly inputSchema = readTargetInputSchema;
```

Modify `packages/api-workflows/src/features/aiTools/UpdateTargetFieldsTool/UpdateTargetFieldsTool.ts`.

Before:

```ts
    public readonly inputSchema = updateTargetFieldsInputSchema;
```

After:

```ts
    public readonly changesContent = true;
    public readonly inputSchema = updateTargetFieldsInputSchema;
```

Modify `packages/api-workflows/src/domain/config/types.ts`.

Before:

```ts
export interface WorkflowAiToolInfo {
    name: string;
    title: string;
    description: string;
}
```

After:

```ts
export interface WorkflowAiToolInfo {
    name: string;
    title: string;
    description: string;
    /** True when the tool writes or updates the content under review (R283). */
    changesContent: boolean;
}
```

Modify `packages/api-workflows/src/features/config/ListWorkflowAiTools/ListWorkflowAiToolsUseCase.ts`.

Before:

```ts
            rows = this.tools.list().map(tool => {
                return { name: tool.name, title: tool.title, description: tool.description };
            });
```

After:

```ts
            rows = this.tools.list().map(tool => {
                return {
                    name: tool.name,
                    title: tool.title,
                    description: tool.description,
                    changesContent: tool.changesContent ?? false
                };
            });
```

Modify `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`.

Before:

```ts
        "What the tool does; the model reads the same text."
        description: String!
    }
```

After:

```ts
        "What the tool does; the model reads the same text."
        description: String!
        "True when the tool writes or updates the content under review."
        changesContent: Boolean!
    }
```

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same three with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

The two built-in tools changed, and `TestWorkflowAiTool` and the schema are shared. Run each file on its own with `yarn test <path> 2>&1 | tail -50` and again with `yarn test:os`:
`packages/api-workflows/__tests__/aiTools/ReadTargetTool.test.ts`
`packages/api-workflows/__tests__/aiTools/UpdateTargetFieldsTool.test.ts`
`packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors. (`ai-powerups` registers no tool, so no other package is touched; the optional field keeps every custom tool implementation valid.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit (replace `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit):

```
git commit -m "feat(api-workflows): add the changesContent flag to AI tools" -m "A WorkflowAiTool can declare changesContent (absent means false). readTarget declares false and updateTargetFields true, and listAiTools returns the flag so the step editor can mark tools that change content." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

## Contract notes

- The contract's Files line puts the built-in tool declarations in `packages/ai-powerups`. The two built-in tools live in `packages/api-workflows/src/features/aiTools/` (`ReadTargetTool`, `UpdateTargetFieldsTool`); `ai-powerups` implements no `WorkflowAiTool`. The flag is declared there, and no `ai-powerups` file changes.
- R283 says the flag defaults to `false`. The interface field is optional (`changesContent?: boolean`) so that default is real for every existing implementation; the use case turns it into a required `boolean` on `WorkflowAiToolInfo`, and the built-ins declare their value explicitly.
- Decisions: `readTarget` is `false` (reads only); `updateTargetFields` is `true` (the only writer of the content under review).
