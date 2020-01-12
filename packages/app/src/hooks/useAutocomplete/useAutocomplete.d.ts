interface UseAutocompleteHook {
    options: any[];
    onInput(value: string): void;
}
export declare const useAutocomplete: (props: any) => UseAutocompleteHook;
export {};
