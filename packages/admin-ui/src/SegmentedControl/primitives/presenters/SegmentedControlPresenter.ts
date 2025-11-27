import { makeAutoObservable } from "mobx";
import type { SegmentedControlVm } from "../SegmentedControlPrimitive.js";
import { SegmentedControlItem } from "~/SegmentedControl/domains/SegmentedControlItem.js";
import { SegmentedControlItemFormatter } from "~/SegmentedControl/domains/SegmentedControlItemFormatter.js";
import type { SegmentedControlItemParams } from "~/SegmentedControl/domains/SegmentedControlItemParams.js";

interface SegmentedControlPresenterParams<TValue = string> {
    items: SegmentedControlItemParams[];
    onValueChange?: (value: TValue) => void;
}

interface ISegmentedControlPresenter<TValue = string> {
    vm: SegmentedControlVm;
    init: (props: SegmentedControlPresenterParams<TValue>) => void;
    changeValue: (value: TValue) => void;
}

class SegmentedControlPresenter<TValue = string>
    implements ISegmentedControlPresenter<TValue>
{
    private params?: SegmentedControlPresenterParams<TValue> = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    public init = (params: SegmentedControlPresenterParams<TValue>) => {
        this.params = params;
    };

    get vm() {
        return {
            items: this.getSegmentedControlItems().map(item =>
                SegmentedControlItemFormatter.format(item)
            )
        };
    }

    public changeValue = (value: TValue) => {
        this.params?.onValueChange?.(value);
    };

    private getSegmentedControlItems() {
        if (!this.params?.items) {
            return [];
        }

        return this.params.items.map(item => SegmentedControlItem.create(item));
    }
}

export {
    SegmentedControlPresenter,
    type SegmentedControlPresenterParams,
    type ISegmentedControlPresenter
};

