export interface ThemeSource {
    name: string;
    label?: string;
    load: () => Promise<any>;
    hidden?: boolean;
}
