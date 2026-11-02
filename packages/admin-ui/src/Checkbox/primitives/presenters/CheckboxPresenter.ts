import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { CheckboxPrimitiveVm } from "../CheckboxPrimitive.js";
import { CheckboxItem } from "~/Checkbox/domains/CheckboxItem.js";
import { type CheckboxItemDto } from "~/Checkbox/domains/CheckboxItemDto.js";
import { CheckboxItemMapper } from "~/Checkbox/domains/CheckboxItemMapper.js";

type CheckboxPresenterParams = CheckboxItemDto & {
    onCheckedChange: (checked: boolean) => void;
};

interface ICheckboxPresenter<TParams extends CheckboxPresenterParams = CheckboxPresenterParams> {
    vm: CheckboxPrimitiveVm;
    init: (params: TParams) => void;
    changeChecked: (checked: boolean) => void;
}

class CheckboxPresenter implements ICheckboxPresenter {
    private params?: CheckboxPresenterParams = undefined;
    private item?: CheckboxItem = undefined;

    constructor() {
        makeAutoObservable<CheckboxPresenter, "params" | "item">(this, {
            params: observableRef,
            item: observableRef
        });
    }

    public init = (params: CheckboxPresenterParams) => {
        this.params = params;
        this.item = CheckboxItem.create({
            id: params.id,
            label: params.label,
            value: params.value,
            checked: params.checked,
            indeterminate: params.indeterminate,
            disabled: params.disabled
        });
    };

    get vm() {
        return {
            item: this.item ? CheckboxItemMapper.toFormatted(this.item) : undefined
        };
    }

    public changeChecked = (checked: boolean) => {
        this.params?.onCheckedChange(checked);
    };
}

export { CheckboxPresenter, type CheckboxPresenterParams, type ICheckboxPresenter };
