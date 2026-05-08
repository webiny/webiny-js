import { makeAutoObservable } from "mobx";
import type { TogglePrimitivVm } from "../TogglePrimitive.js";
import type { ToggleItemDto } from "../../domains/index.js";
import { ToggleItem, ToggleItemMapper } from "../../domains/index.js";

type TogglePresenterParams = ToggleItemDto & {
    onChange?: (checked: boolean) => void;
};

interface ITogglePresenter<TParams extends TogglePresenterParams = TogglePresenterParams> {
    vm: TogglePrimitivVm;
    init: (params: TParams) => void;
    changeChecked: (checked: boolean) => void;
}

class TogglePresenter implements ITogglePresenter {
    private params?: TogglePresenterParams = undefined;
    private item?: ToggleItem = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    public init = (params: TogglePresenterParams) => {
        this.params = params;
        this.item = ToggleItem.create({
            id: params.id,
            label: params.label,
            value: params.value,
            checked: params.checked,
            disabled: params.disabled,
            icon: params.icon,
            iconPosition: params.iconPosition
        });
    };

    get vm() {
        return {
            item: this.item ? ToggleItemMapper.toFormatted(this.item) : undefined
        };
    }

    public changeChecked = (checked: boolean) => {
        this.params?.onChange?.(checked);
    };
}

export { TogglePresenter, type TogglePresenterParams, type ITogglePresenter };
