export interface IColumnsVisibilityUpdater {
    update(value: Record<string, boolean>): Promise<void>;
}
