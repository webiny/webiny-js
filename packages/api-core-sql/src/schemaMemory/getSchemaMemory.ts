/**
 * What this process knows about some tables: whether they were created, and a set of names it has
 * checked (tables, tenants). Shared by every caller that asks for the same key, so it outlives the
 * instance that learned it. The Postgres CMS and folder catalog are registered per request (they
 * come with the project's extensions), so each request builds new instances: what they learn about
 * the tables must live here, for the process.
 */
export interface ISchemaMemory {
    /** What the memory is of: the key it was asked for with. */
    readonly key: string;
    /**
     * Runs `create` once per process; callers at the same time wait for the same run. A failed run is
     * forgotten, so the next call tries again.
     */
    once(create: () => Promise<void>): Promise<void>;
    /** Whether the tables are known to exist (`once` succeeded, or `markReady` was called). */
    isReady(): boolean;
    /** Records that the tables exist (created in a caller's transaction that has committed). */
    markReady(): void;
    /** Names this process has checked (tables, tenants). */
    readonly known: Set<string>;
    /**
     * Goes up on every `reset()`. Work that started before a reset must not record what it learned
     * after it: compare the value taken at the start with the current one.
     */
    readonly generation: number;
    /** Forgets everything (test setups drop all tables between tests). */
    reset(): void;
}

class SchemaMemory implements ISchemaMemory {
    public readonly known = new Set<string>();
    private pending?: Promise<void>;
    private ready = false;
    private currentGeneration = 0;

    public constructor(
        public readonly key: string,
        private readonly onReset?: () => void
    ) {}

    public once(create: () => Promise<void>): Promise<void> {
        if (this.ready) {
            return Promise.resolve();
        }
        if (this.pending) {
            return this.pending;
        }
        // A run that ends after a reset() must neither mark the tables ready nor clear a newer run.
        const generation = this.currentGeneration;
        const run: Promise<void> = create().then(
            () => {
                if (this.currentGeneration === generation) {
                    this.ready = true;
                }
            },
            error => {
                if (this.pending === run) {
                    this.pending = undefined;
                }
                throw error;
            }
        );
        this.pending = run;
        return run;
    }

    public get generation(): number {
        return this.currentGeneration;
    }

    public isReady(): boolean {
        return this.ready;
    }

    public markReady(): void {
        this.ready = true;
    }

    public reset(): void {
        this.currentGeneration += 1;
        this.pending = undefined;
        this.ready = false;
        this.known.clear();
        this.onReset?.();
    }
}

const memories = new Map<string, SchemaMemory>();

/**
 * The process's memory for `key` (a table name, or a name that stands for a set of tables). Made on
 * first use, with `onReset` run whenever it is reset; later callers get the same one.
 *
 * Each memory joins `globalThis.__sqlTableManagers` once, so test setups that drop all tables and
 * call `reset()` on every entry reset it too.
 */
export function getSchemaMemory(key: string, onReset?: () => void): ISchemaMemory {
    let memory = memories.get(key);
    if (!memory) {
        memory = new SchemaMemory(key, onReset);
        memories.set(key, memory);
        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as ISchemaMemory[];
        managers.push(memory);
    }
    return memory;
}
