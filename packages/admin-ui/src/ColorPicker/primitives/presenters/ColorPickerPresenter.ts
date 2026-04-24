import { makeAutoObservable } from "mobx";
import type { ColorResult } from "react-color";

interface ColorPickerPresenterParams {
    onOpenChange?: (open: boolean) => void;
    onValueChange?: (value: string) => void;
    onValueCommit?: (value: string) => void;
    value?: string;
}

interface IColorPickerPresenter {
    vm: {
        open: boolean;
        value: string;
    };
    init: (params: ColorPickerPresenterParams) => void;
    setColor: (color: Pick<ColorResult, "hex">) => void;
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
        return {
            open: this.open,
            value: this.value
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

    setOpen = (open: boolean) => {
        this.open = open;
        this.params?.onOpenChange?.(open);
    };
}

export { ColorPickerPresenter, type ColorPickerPresenterParams, type IColorPickerPresenter };
