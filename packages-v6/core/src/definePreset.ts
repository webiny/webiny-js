import { Plugin } from "./definePlugin";

export interface Preset {
    plugins: Plugin[];
}

export interface PresetFactory<TOptions> {
    (options: TOptions): Preset | Promise<Preset>;
}

export function definePreset<TOptions = unknown>(factory: PresetFactory<TOptions>) {
    return (options: TOptions) => factory(options);
}
