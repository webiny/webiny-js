import { createAbstraction } from "@webiny/feature/admin";

export interface ISpeechDictation {
    readonly supported: boolean;
    /* `onText` receives finalised phrases only, never the interim guesses. */
    start(onText: (text: string) => void, onStop: () => void): void;
    stop(): void;
}

export const SpeechDictation = createAbstraction<ISpeechDictation>("BugReport/SpeechDictation");

export namespace SpeechDictation {
    export type Interface = ISpeechDictation;
}
