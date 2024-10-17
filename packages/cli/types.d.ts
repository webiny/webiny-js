/**
 * Rename file to types.ts when switching the package to Typescript.
 */

export type GenericRecordKey = string | number | symbol;

export type GenericRecord<K extends GenericRecordKey = GenericRecordKey, V = any> = Record<K, V>;

/**
 * A simplified plugins container interface, used specifically within the Webiny CLI.
 * Not in relation with "@webiny/plugins" package.
 */
export interface PluginsContainer {
    byType<T extends Plugin>(type: T["type"]): T[];

    byName<T extends Plugin>(name: T["name"]): T;
}

/**
 * A simplified plugin interface, used specifically within the Webiny CLI.
 * Not in relation with "@webiny/plugins" package.
 */
export interface Plugin {
    type: string;
    name?: string;

    [key: string]: any;
}

interface Project {
    /**
     * Name of the project.
     */
    name: string;
    /**
     * Configurations.
     */
    config: Record<string, any>;
    /**
     * Root path of the project.
     */
    root: string;
}

export interface ProjectApplication {
    /**
     * Unique ID of the project application.
     */
    id: string;
    /**
     * Name of the project application.
     */
    name: string;
    /**
     * Description of the project application.
     */
    description: string;
    /**
     * Type of the project application.
     */
    type: string;
    /**
     * Root path of the project application.
     */
    root: string;
    /**
     * Commonly used paths.
     */
    paths: {
        relative: string;
        absolute: string;
        workspace: string;
    };
    /**
     * Project application config (exported via `webiny.application.ts` file).
     */
    config: Record<string, any>;
    /**
     * Project application package.json.
     */
    project: Project;

    /**
     * A list of all the packages in the project application.
     */
    get packages(): Array<{
        name: string;
        paths: {
            root: string;
            packageJson: string;
            config: string;
        };
        packageJson: Record<string, any>;
        get config(): any;
    }>;
}

/**
 * A type that represents the logging method.
 */
interface Log {
    (...args: any): string;

    hl: (...args: any) => string;
    highlight: (...args: any) => string;
}

/**
 * Interface representing the CLI Context.
 */
export interface CliContext {
    /**
     * All registered plugins.
     */
    plugins: PluginsContainer;
    /**
     * All the environment variables.
     */
    loadedEnvFiles: Record<string, any>;
    /**
     * Version of the Webiny CLI.
     */
    version: string;
    /**
     * Project information.
     */
    project: Project;
    /**
     * Trigger given callback on SIGINT.
     */
    onExit: (cb: () => any) => void;
    /**
     * Import a given module.
     */
    import: (module: string) => Promise<void>;
    /**
     * Regular logging.
     */
    log: Log;
    /**
     * Info logging.
     */
    info: Log;
    /**
     * Success logging.
     */
    success: Log;
    /**
     * Debug logging.
     */
    debug: Log;
    /**
     * Warnings logging.
     */
    warning: Log;
    /**
     * Errors logging.
     */
    error: Log;
    /**
     * Resolve given dir or dirs against project root path.
     */
    resolve: (dir: string) => string;

    /**
     * Provides a way to store some metadata in the project's local ".webiny/cli.json" file.
     * Only trivial data should be passed here, specific to the current project.
     */
    localStorage: {
        set: (key: string, value: string) => Record<string, any>;
        get: (key: string) => any;
    };
}
