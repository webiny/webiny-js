import type { Container } from "@webiny/feature/api";
import { registerBuildParams, registerExtensions } from "@webiny/handler";
import { ApiCoreFeature } from "@webiny/api-core";
import { SqlSchemaSetup } from "./abstractions.js";

/** The project's API extensions, as the handlers take them (`extensions()`). */
export type SqlStorageExtensions = Parameters<typeof registerExtensions>[1];

export interface RequiredSqlSchemaSetup {
    /** The step's name (`SqlSchemaSetup.name`). */
    name: string;
    /** The error when no step of that name is registered: what to add to the project. */
    message: string;
}

export interface RunSqlSchemaSetupParams {
    /** A container of its own, with the storage registered in it. */
    container: Container;
    /** The project's API extensions: the modules among them register their own steps. */
    extensions?: SqlStorageExtensions;
    /** Steps the storage can't run without (a module the project must add). */
    required?: RequiredSqlSchemaSetup[];
}

/**
 * Runs every schema setup step in `container`, after applying the project's extensions the way a
 * request does: build params first, then the extensions. The modules among the extensions (the
 * Postgres CMS, the folder catalog) register their own steps, so setup creates the tables of exactly
 * the modules the API runs, with their settings.
 *
 * Extensions only register, but some decide whether to while they do: they read the feature flags or
 * the license (`WcpContext`), as in a request. So, as a request does, the build params come first,
 * then the core API (`ApiCoreFeature`, which has both), then the extensions. The license isn't
 * loaded: a module gated on it registers nothing here. The storage modules (CMS, folder catalog)
 * aren't gated.
 *
 * Checks `required` before running anything, so a missing module fails before any DDL. Returns the
 * names of the steps it ran, in order.
 */
export async function runSqlSchemaSetup(params: RunSqlSchemaSetupParams): Promise<string[]> {
    const { container, extensions = [], required = [] } = params;

    await registerBuildParams(container, extensions);
    ApiCoreFeature.register(container, { wcpLicense: undefined });
    await registerExtensions(container, extensions);

    const steps = resolveSteps(container, required);
    for (const step of required) {
        if (!steps.some(item => item.name === step.name)) {
            throw new Error(step.message);
        }
    }

    const done: string[] = [];
    for (const step of steps) {
        await step.setup();
        done.push(step.name);
    }
    return done;
}

/**
 * Builds the steps. A step whose module needs another one that is missing (the folder catalog needs
 * the CMS's table names) can't be built, and that fails before any step has a name to check. So
 * the failure says which modules the storage needs, with the cause.
 */
function resolveSteps(container: Container, required: RequiredSqlSchemaSetup[]) {
    try {
        return container.resolveAll(SqlSchemaSetup);
    } catch (error) {
        if (!required.length) {
            throw error;
        }
        const cause = error instanceof Error ? error.message : String(error);
        const needs = required.map(step => step.message).join(" ");
        throw new Error(`Schema setup could not build its steps (${cause}). ${needs}`, {
            cause: error
        });
    }
}
