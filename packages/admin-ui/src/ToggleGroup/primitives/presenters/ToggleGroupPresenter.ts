import { makeAutoObservable } from "mobx";
import type { ToggleGroupVm } from "../ToggleGroupPrimitive.js";
import type { ToggleGroupItemParams } from "../../domains/index.js";
import { ToggleGroupItem, ToggleGroupItemFormatter } from "../../domains/index.js";

interface ToggleGroupPresenterParams {
    items: ToggleGroupItemParams[];
    onChange?: (value: string | string[]) => void;
}

interface IToggleGroupPresenter {
    vm: ToggleGroupVm;
    init: (params: ToggleGroupPresenterParams) => void;
    changeValue: (value: string | string[]) => void;
}

class ToggleGroupPresenter implements IToggleGroupPresenter {
    private params?: ToggleGroupPresenterParams = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    public init = (params: ToggleGroupPresenterParams) => {
        this.params = params;
    };

    get vm(): ToggleGroupVm {
        return {
            items: (this.params?.items ?? [])
                .map(item => ToggleGroupItem.create(item))
                .map(item => ToggleGroupItemFormatter.format(item))
        };
    }

    public changeValue = (value: string | string[]) => {
        this.params?.onChange?.(value);
    };
}

export { ToggleGroupPresenter, type ToggleGroupPresenterParams, type IToggleGroupPresenter };
