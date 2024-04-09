export interface IColumnsVisibilityGateway {
    get(): Promise<Record<string, boolean> | undefined>;
    set(value: Record<string, boolean>): Promise<void>;
}
