import { makeAutoObservable } from "mobx";
import type { ColorResult } from "react-color";

/**
 * A named colour offered next to the free picker, such as a theme colour. `value` is any CSS colour,
 * a `var(--...)` reference included, and is emitted exactly as given.
 */
interface ColorPickerPreset {
    id: string;
    label: string;
    value: string;
}

interface ColorPickerPresetView extends ColorPickerPreset {
    selected: boolean;
}

interface ColorPickerPresenterParams {
    presets?: ColorPickerPreset[];
    onOpenChange?: (open: boolean) => void;
    onValueChange?: (value: string) => void;
    onValueCommit?: (value: string) => void;
    value?: string;
}

interface IColorPickerPresenter {
    vm: {
        open: boolean;
        value: string;
        presets: ColorPickerPresetView[];
    };
    init: (params: ColorPickerPresenterParams) => void;
    setColor: (color: Pick<ColorResult, "hex">) => void;
    selectPreset: (id: string) => void;
    setOpen: (open: boolean) => void;
}

class ColorPickerPresenter implements IColorPickerPresenter {
    private params?: ColorPickerPresenterParams = undefined;
    private open = false;
    private value = "";

    constructor() {
        makeAutoObservable(this);
    }

    get vm() {
        const presets = this.params?.presets ?? [];
        return {
            open: this.open,
            value: this.value,
            presets: presets.map(preset => ({ ...preset, selected: preset.value === this.value }))
        };
    }

    init(params: ColorPickerPresenterParams) {
        this.params = params;
        this.value = params.value || "";
    }

    setColor = (color: Pick<ColorResult, "hex">) => {
        this.value = color.hex;
        this.params?.onValueChange?.(color.hex);
    };

    commitColor = (color: Pick<ColorResult, "hex">) => {
        this.value = color.hex;
        this.params?.onValueCommit?.(color.hex);
    };

    selectPreset = (id: string) => {
        const preset = this.params?.presets?.find(candidate => candidate.id === id);
        if (!preset) {
            return;
        }
        this.value = preset.value;
        this.params?.onValueChange?.(preset.value);
        this.params?.onValueCommit?.(preset.value);
    };

    setOpen = (open: boolean) => {
        this.open = open;
        this.params?.onOpenChange?.(open);
    };
}

export {
    ColorPickerPresenter,
    type ColorPickerPreset,
    type ColorPickerPresetView,
    type ColorPickerPresenterParams,
    type IColorPickerPresenter
};
