export interface Plugin<T = Record<string, any>> {
    type: string;
    name?: string;
    [key: string]: any;
}

export interface PluginsContainer {
    byType<T extends Plugin>(type: T["type"]): T[];
    byName<T extends Plugin>(name: T["name"]): T;
}

export interface Project {
    name: string;
    root: string;
    config: Record<string, any>;
}

export interface CliContext {
    plugins: PluginsContainer;
    project: Project;
}
