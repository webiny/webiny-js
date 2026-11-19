import { createAbstraction } from "@webiny/feature/api";
import type { TransportSettings } from "~/api/types.js";

export interface ICodeMailerSettings {
    get(transportName: string): TransportSettings | null;
}

export const CodeMailerSettings = createAbstraction<ICodeMailerSettings>("CodeMailerSettings");

export namespace CodeMailerSettings {
    export type Interface = ICodeMailerSettings;
}
