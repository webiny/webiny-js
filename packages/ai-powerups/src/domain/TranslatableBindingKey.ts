/**
 * The key a translatable binding is sent to the AI under: `{elementId}.inputs.{inputName}`.
 * A global's root element id, `$global:{name}`, can hold dots, so a key is split on its last
 * `.inputs.`.
 */
export class TranslatableBindingKey {
    static readonly SEPARATOR = ".inputs.";

    private constructor(
        readonly elementId: string,
        readonly inputName: string
    ) {}

    static from(elementId: string, inputName: string): TranslatableBindingKey {
        return new TranslatableBindingKey(elementId, inputName);
    }

    /**
     * The key's element id and input name, or `null` when the key doesn't name an input.
     */
    static parse(key: string): TranslatableBindingKey | null {
        const index = key.lastIndexOf(TranslatableBindingKey.SEPARATOR);
        if (index < 0) {
            return null;
        }
        return new TranslatableBindingKey(
            key.slice(0, index),
            key.slice(index + TranslatableBindingKey.SEPARATOR.length)
        );
    }

    toString(): string {
        return `${this.elementId}${TranslatableBindingKey.SEPARATOR}${this.inputName}`;
    }
}
