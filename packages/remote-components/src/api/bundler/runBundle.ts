import { createContext, runInContext } from "node:vm";

/**
 * Runs a bundle and then `expression` in a fresh `node:vm` context, as one script under one timeout,
 * and returns what the expression evaluates to. The expression reaches the bundle's module as
 * `__remoteComponent__`, so `createComponent` and everything it runs (the component's module-level
 * code, and a render when the expression does one) count against the timeout. Promise jobs the
 * script queues run before it returns, inside the timeout too.
 *
 * The context starts empty apart from `globals`. `node:vm` is not a security boundary, so this keeps
 * well-behaved bundles away from the process's globals and stops runaway ones; it does not contain a
 * hostile one. Callers that run bundles they don't trust pass no host objects in `globals` and take
 * only primitive results out.
 */
export function runBundle(
    bundled: string,
    expression: string,
    globals: Record<string, unknown>,
    timeout: number
): unknown {
    const sandbox = createContext(Object.assign(Object.create(null), globals), {
        microtaskMode: "afterEvaluate"
    });

    return runInContext(`var __remoteComponent__;\n${bundled}\n;${expression}`, sandbox, {
        timeout
    });
}
