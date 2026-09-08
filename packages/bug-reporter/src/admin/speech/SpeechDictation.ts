import { SpeechDictation as Abstraction } from "./abstractions.js";

/*
 * The Web Speech API is not in the DOM lib types, so the shape we rely on is declared here.
 * Only the members this file touches are modelled.
 */
interface ISpeechRecognitionAlternative {
    transcript: string;
}

interface ISpeechRecognitionResult {
    readonly length: number;
    isFinal: boolean;
    [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
    readonly length: number;
    [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent {
    resultIndex: number;
    results: ISpeechRecognitionResultList;
}

interface ISpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: ISpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
}

interface ISpeechRecognitionConstructor {
    new (): ISpeechRecognition;
}

function findConstructor(): ISpeechRecognitionConstructor | null {
    if (typeof window === "undefined") {
        return null;
    }

    const scope = window as unknown as Record<string, unknown>;
    const candidate = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;

    if (typeof candidate !== "function") {
        return null;
    }

    const constructor = candidate as ISpeechRecognitionConstructor;
    return constructor;
}

/*
 * Dictation for the report box, so "hey, this isn't working" is genuinely all someone has
 * to do. Speech recognition runs in the browser, needs no key and costs nothing, but it is
 * a Chrome and Safari feature — elsewhere `supported` is false and the mic button hides.
 */
class SpeechDictationImpl implements Abstraction.Interface {
    private recognition: ISpeechRecognition | null = null;

    get supported(): boolean {
        return findConstructor() !== null;
    }

    start(onText: (text: string) => void, onStop: () => void): void {
        const constructor = findConstructor();
        if (!constructor) {
            onStop();
            return;
        }

        this.stop();

        const recognition = new constructor();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = navigator.language || "en-US";

        recognition.onresult = event => {
            for (let index = event.resultIndex; index < event.results.length; index++) {
                const result = event.results[index];
                if (!result.isFinal) {
                    continue;
                }
                const alternative = result[0];
                if (alternative && alternative.transcript.trim() !== "") {
                    onText(alternative.transcript.trim());
                }
            }
        };

        recognition.onerror = () => {
            this.recognition = null;
            onStop();
        };

        recognition.onend = () => {
            this.recognition = null;
            onStop();
        };

        this.recognition = recognition;
        recognition.start();
    }

    stop(): void {
        if (!this.recognition) {
            return;
        }

        const recognition = this.recognition;
        this.recognition = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
    }
}

export const SpeechDictation = Abstraction.createImplementation({
    implementation: SpeechDictationImpl,
    dependencies: []
});
