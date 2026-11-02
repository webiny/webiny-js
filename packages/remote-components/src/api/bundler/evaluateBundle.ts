import { createContext, runInNewContext } from "node:vm";

export interface EvaluatedBundle {
    createComponent: (runtime: unknown) => {
        component?: unknown;
        manifest?: Record<string, unknown>;
    };
}

/**
 * Runs a bundle in a fresh context with nothing in it and returns the module it defines. Not
 * `new Function`, which would run it with the process's own globals in scope (`process`, `fetch`,
 * environment variables): bundles are often generated, so they are not input we control end to end.
 * The timeout bounds a module-level loop.
 */
export function evaluateBundle(bundled: string, timeout: number): EvaluatedBundle {
    const sandbox = createContext(Object.create(null));

    return runInNewContext(`var __remoteComponent__; ${bundled}; __remoteComponent__;`, sandbox, {
        timeout
    });
}
