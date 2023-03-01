export interface ColorPicker {
    onChange: (color: string) => void;
    color: string;
    open: boolean;
}
