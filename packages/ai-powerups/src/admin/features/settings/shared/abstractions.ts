import { createAbstraction } from "@webiny/feature/admin";

export interface ISettingsCache {
  get(): ISettings | null;
  set(data: Record<string, any>): void;
}

export const SettingsCache = createAbstraction<ISettingsCache>(
  "AiPowerUps/SettingsCache",
);
export namespace SettingsCache {
  export type Interface = ISettingsCache;
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

export type ISettings = Record<string, any>;
