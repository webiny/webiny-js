import { makeAutoObservable, observableRef } from "mobx";
import type { RadioGroupVm } from "../RadioGroupPrimitive.js";
import { RadioItem } from "~/RadioGroup/domains/RadioItem.js";
import { RadioItemFormatter } from "~/RadioGroup/domains/RadioItemFormatter.js";
import type { RadioItemParams } from "~/RadioGroup/domains/RadioItemParams.js";

interface RadioGroupPresenterParams<TValue = string> {
    items: RadioItemParams[];
    onValueChange?: (value: TValue) => void;
}

interface IRadioGroupPresenter<TValue = string> {
    vm: RadioGroupVm;
    init: (props: RadioGroupPresenterParams<TValue>) => void;
    changeValue: (value: TValue) => void;
}

class RadioGroupPresenter<TValue = string> implements IRadioGroupPresenter<TValue> {
    private params?: RadioGroupPresenterParams<TValue> = undefined;

    constructor() {
        makeAutoObservable<RadioGroupPresenter<TValue>, "params">(this, {
            params: observableRef
        });
    }

    public init = (params: RadioGroupPresenterParams<TValue>) => {
        this.params = params;
    };

    get vm() {
        return {
            items: this.getRadioItems().map(item => RadioItemFormatter.format(item))
        };
    }

    public changeValue = (value: TValue) => {
        this.params?.onValueChange?.(value);
    };

    private getRadioItems() {
        if (!this.params?.items) {
            return [];
        }

        return this.params.items.map(item => RadioItem.create(item));
    }
}

export { RadioGroupPresenter, type RadioGroupPresenterParams, type IRadioGroupPresenter };
