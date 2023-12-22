export interface IColumnsVisibilityGateway {
    get(): Record<string, boolean> | undefined;
    set(value: Record<string, boolean>): Promise<void>;
}
