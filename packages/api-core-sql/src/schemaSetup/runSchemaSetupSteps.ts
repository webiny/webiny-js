import type { Knex } from "knex";
import type { Container } from "@webiny/feature/api";
import { SqlConnectionFeature } from "~/connection/SqlConnectionFeature.js";
import { SqlSchemaSetup, type ISqlSchemaSetupRequest } from "./abstractions.js";

export interface RequiredSqlSchemaSetup {
    /** The step's name (`SqlSchemaSetup.name`). */
    name: string;
    /** The error when no step of that name is registered: what to add to the project. */
    message: string;
}

export interface RunSchemaSetupStepsParams {
    /** The root container the storage is registered in. The setup's container is its child. */
    root: Container;
    /** The setup's connection: a transaction the runner opened. */
    knex: Knex;
    tableNamePrefix?: string;
    /** Registers a request's parts in the setup's container. */
    request: ISqlSchemaSetupRequest;
    /** Steps the storage can't run without (a module the project must add). */
    required?: RequiredSqlSchemaSetup[];
}

/**
 * The part of schema setup every SQL storage shares, run inside the runner's transaction. It builds
 * a container on the setup's connection the way a request's is built, and runs every schema setup
 * step in it.
 *
 * The container is a child of the root, so it has what a request has (the logger, the storages'
 * `RequestStorage`). The setup's connection is registered in it first, with schema-managed off:
 * every storage the request registers runs on it, including the ones built while the request
 * registers and the modules' singletons, which are built in the container that registers them.
 *
 * Checks `required` before running anything, so a missing module fails before any DDL. Returns the
 * names of the steps it ran, in order.
 */
export async function runSchemaSetupSteps(params: RunSchemaSetupStepsParams): Promise<string[]> {
    const { root, knex, tableNamePrefix, request, required = [] } = params;

    const container = root.createChildContainer();
    SqlConnectionFeature.register(container, { knex, tableNamePrefix, schemaManaged: false });
    await request.register(container);

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
