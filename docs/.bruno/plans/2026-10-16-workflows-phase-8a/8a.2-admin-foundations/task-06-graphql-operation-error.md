### Task 6: `GraphQLOperationError` in `@webiny/app`

R204 (user answer Q3, `../00-answers.md`), A81; Review Focus 9. Today every base gateway that gets an error envelope back from its mutation throws a plain `new Error(message)`, so the machine-readable `code` and the `data` the server attached are lost before they reach a use case or a presenter. The workflows warning flow (D157, R205) needs the code `Workflows/Review/ActiveReviewOnTrash` and its data, and the review presenters (R220) map conflict codes to copy. This task adds the one typed error both sides use. It adds only the class and its export; no gateway changes here (Tasks 31 and 32 change the eight gateways, Task 9 throws it from `ReviewUseCases`, Task 13 and Task 33 catch it with `instanceof`).

- **Shape:** `GraphQLOperationErrorInput { message: string; code?: string | null; data?: unknown }`. `class GraphQLOperationError extends Error` with `readonly code: string | null` and `readonly data: unknown`; `name = "GraphQLOperationError"`; `code` and `data` default to `null` when omitted or `undefined`; `data` is kept by reference (no copy, no serialisation); `message` is the given message unchanged (a caller that wants a fallback message supplies it, as the gateways do in Tasks 31-32).
- **Where:** `packages/app/src/errors/GraphQLOperationError.ts`, exported from the existing barrel `packages/app/src/errors/index.ts`; consumers import `@webiny/app/errors/index.js` (the package exports `"./*": "./*"`, verified in `packages/app/package.json`; the build writes `packages/app/dist/` and `node_modules/@webiny/app` links to it, hence the build step before dependants).
- **Target:** `tsconfig.build.json` targets `esnext`, so a class that extends `Error` keeps its prototype chain and `instanceof GraphQLOperationError` works without `Object.setPrototypeOf`. The test pins `instanceof` for both classes.
- **No behaviour change anywhere else:** nothing imports the class yet; `NetworkErrorEvent`, `AuthenticationErrorEvent` and the `errors/overlay` folder are untouched.

**Files:**
- Create: `packages/app/src/errors/GraphQLOperationError.ts`
- Create: `packages/app/src/errors/__tests__/GraphQLOperationError.test.ts`
- Modify: `packages/app/src/errors/index.ts`

**Interfaces:**
- Consumes: the built-in `Error`. Existing barrel `packages/app/src/errors/index.ts` (verified: it exports `NetworkErrorEvent`, `NetworkErrorPayload`, `NetworkErrorEventHandler`, `AuthenticationErrorEvent`, `AuthenticationErrorPayload`, `AuthenticationErrorEventHandler`).
- Produces: `GraphQLOperationErrorInput`, `GraphQLOperationError` (`@webiny/app/errors/index.js`), consumed by Tasks 9, 13, 15, 31, 32, 33.

**Test runner note:** `packages/app` runs `yarn test <path>` only (vitest, `packages/app/vitest.config.ts`, node environment); it is not an `-es`/`-os` package and has no storage leg. The test file below has no React and needs no jsdom.

- [ ] **Step 1: Write the failing tests**

Create `packages/app/src/errors/__tests__/GraphQLOperationError.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "../GraphQLOperationError.js";
import { GraphQLOperationError as ExportedGraphQLOperationError } from "../index.js";

describe("GraphQLOperationError", () => {
    it("keeps the message, the code and the data", () => {
        const data = { reviews: [{ reviewId: "review-1", title: "Spring launch" }] };

        const error = new GraphQLOperationError({
            message: "This content has a review in progress.",
            code: "Workflows/Review/ActiveReviewOnTrash",
            data
        });

        expect(error.message).toBe("This content has a review in progress.");
        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toBe(data);
    });

    it("defaults code and data to null when they are omitted", () => {
        const error = new GraphQLOperationError({ message: "The request failed." });

        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("defaults code and data to null when they are null or undefined", () => {
        const withNulls = new GraphQLOperationError({
            message: "The request failed.",
            code: null,
            data: null
        });
        const withUndefined = new GraphQLOperationError({
            message: "The request failed.",
            code: undefined,
            data: undefined
        });

        expect(withNulls.code).toBeNull();
        expect(withNulls.data).toBeNull();
        expect(withUndefined.code).toBeNull();
        expect(withUndefined.data).toBeNull();
    });

    it("keeps falsy data values that are not null or undefined", () => {
        const withZero = new GraphQLOperationError({ message: "m", data: 0 });
        const withEmptyString = new GraphQLOperationError({ message: "m", data: "" });
        const withFalse = new GraphQLOperationError({ message: "m", data: false });

        expect(withZero.data).toBe(0);
        expect(withEmptyString.data).toBe("");
        expect(withFalse.data).toBe(false);
    });

    it("is an Error with its own name and a stack", () => {
        const error = new GraphQLOperationError({ message: "The request failed." });

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.name).toBe("GraphQLOperationError");
        expect(typeof error.stack).toBe("string");
        expect(String(error)).toBe("GraphQLOperationError: The request failed.");
    });

    it("is told apart from a plain Error by instanceof after a throw and catch", () => {
        let caught: unknown = null;
        try {
            throw new GraphQLOperationError({ message: "Nope", code: "Workflows/NotAuthorized" });
        } catch (error) {
            caught = error;
        }

        let plain: unknown = null;
        try {
            throw new Error("Nope");
        } catch (error) {
            plain = error;
        }

        expect(caught instanceof GraphQLOperationError).toBe(true);
        expect(plain instanceof GraphQLOperationError).toBe(false);
    });

    it("is exported from the errors barrel as the same class", () => {
        expect(ExportedGraphQLOperationError).toBe(GraphQLOperationError);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app/src/errors/__tests__/GraphQLOperationError.test.ts 2>&1 | tail -50
```

Expected: FAIL. The file cannot be loaded: `Failed to resolve import "../GraphQLOperationError.js"` (the module does not exist yet), so no test runs.

- [ ] **Step 3: Implement**

Create `packages/app/src/errors/GraphQLOperationError.ts`:

```ts
export interface GraphQLOperationErrorInput {
    message: string;
    code?: string | null;
    data?: unknown;
}

/**
 * Thrown by gateways and use cases when a GraphQL operation answers with an error envelope.
 * Unlike a plain `Error`, it keeps the server's machine-readable `code` and its `data`, so
 * callers can react to a specific refusal with `instanceof` and `code`.
 */
export class GraphQLOperationError extends Error {
    readonly code: string | null;
    readonly data: unknown;

    constructor(input: GraphQLOperationErrorInput) {
        super(input.message);
        this.name = "GraphQLOperationError";
        this.code = input.code ?? null;
        this.data = input.data ?? null;
    }
}
```

Modify `packages/app/src/errors/index.ts`: append two lines at the end of the file (the existing six lines stay as they are):

```ts
export { GraphQLOperationError } from "./GraphQLOperationError.js";
export type { GraphQLOperationErrorInput } from "./GraphQLOperationError.js";
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app/src/errors/__tests__/GraphQLOperationError.test.ts 2>&1 | tail -50
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Run the existing tests covering the changed code, type-check and build**

The barrel is imported by the router and the GraphQL client code paths only through the event handlers, so run one existing suite as a smoke run only (it does not exercise the new class) and the build, which type-checks the package including the co-located test:

```bash
yarn test packages/app/src/features/graphqlClient/__tests__/GraphQLClient.test.ts 2>&1 | tail -30
yarn build -p @webiny/app --no-cache 2>&1 | tail -30
```

Expected: the GraphQL client suite (smoke run only) passes unchanged and the build succeeds. `packages/app` has no root `__tests__/` folder, so `check:test:types` does not list it (`scripts/utils/getPackages.js`, `hasTests`, R243); the build type-checks the co-located tests (`tsconfig.build.json` includes `src`). After the build, `packages/app/dist/errors/index.js` exports `GraphQLOperationError` (Tasks 9, 13, 15, 31, 32 and 33 import it from `@webiny/app/errors/index.js`).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app): add GraphQLOperationError that keeps the server error code and data" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- No conflict with the contract: names, paths and the `null` defaults match the Interfaces entry for Task 6 exactly.
- `packages/app` has no `src/errors/__tests__` folder today (its tests live in `__tests__` folders next to features, for example `src/features/graphqlClient/__tests__/`), so the contract's path creates the first one there; `testPattern` (`/{__tests__,src}/**/*.{test,test-d}.[jt]s?(x)`) picks it up.
- Size: small, one source file and one test file.
