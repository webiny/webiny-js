import { createAbstraction } from "@webiny/feature/admin";

export interface IAiPowerUpsSettingsCache {
    get(): IAiPowerUpsSettings | null;
    set(data: IAiPowerUpsSettings): void;
}

export const SettingsCache = createAbstraction<IAiPowerUpsSettingsCache>(
    "AiPowerUps/SettingsCache"
);
export namespace SettingsCache {
    export type Interface = IAiPowerUpsSettingsCache;
}

// export interface ISettings {
//     providers: {
//         presets: {
//             name: string;
//             description: string;
//             model: string;
//             apiKey: string;
//         }[];
//     };
//     personas: {
//         presets: {
//             name: string;
//             description: string;
//         };
//     };
// };

export interface IAiPowerUpsSettings {
    providers: {
        presets: {
            name: string;
            description: string;
            model: string;
            apiKey: string;
        }[];
    };
}
