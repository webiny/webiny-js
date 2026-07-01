import { createAbstraction } from "@webiny/feature/admin";

export interface IClipboardItem {
    type: string;
    data: Record<string, unknown>;
}

export interface IClipboard {
    readonly item: IClipboardItem | null;
    copy(item: IClipboardItem): void;
    paste(): IClipboardItem | null;
    clear(): void;
}

export const Clipboard = createAbstraction<IClipboard>("Clipboard");

export namespace Clipboard {
    export type Interface = IClipboard;
}
