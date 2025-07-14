import { makeAutoObservable } from "mobx";
import {
    SelectOptionsVm,
    SelectTriggerVm,
    SelectOption as SelectOptionParams,
    type SelectRootVm
} from "../SelectPrimitive";
import { SelectOption, SelectOptionMapper } from "../../domains";

interface SelectPresenterParams {
    options?: SelectOptionParams[];
    value?: string;
    placeholder?: string;
    displayResetAction?: boolean;
    onValueChange?: (value: string) => void;
    onValueReset?: () => void;
}

interface ISelectPresenter<TParams extends SelectPresenterParams = SelectPresenterParams> {
    vm: {
        selectRoot: SelectRootVm;
        selectTrigger: SelectTriggerVm;
        selectOptions: SelectOptionsVm;
    };
    init: (params: TParams) => void;
    changeValue: (value: string) => void;
    resetValue: () => void;
}

class SelectPresenter implements ISelectPresenter {
    private params?: SelectPresenterParams;
    private options?: SelectOption[];
    private displayResetAction = true;

    constructor() {
        this.params = undefined;
        makeAutoObservable(this);
    }

    init(params: SelectPresenterParams) {
        this.params = params;
        this.options = this.transformOptions(params.options);
        this.displayResetAction = params?.displayResetAction ?? true;
    }

    get vm() {
        return {
            selectRoot: {
                value: this.params?.value || ""
            },
            selectTrigger: {
                placeholder: this.params?.placeholder || "Select an option",
                hasValue: !!this.params?.value,
                displayResetAction: this.displayResetAction
            },
            selectOptions: {
                options: this.options?.map(option => SelectOptionMapper.toFormatted(option)) ?? []
            }
        };
    }

    public changeValue = (value?: string) => {
        this.params?.onValueChange?.(value || "");
    };

    public resetValue = () => {
        this.params?.onValueChange?.("");
        this.params?.onValueReset?.();
    };

    private transformOptions(options: SelectPresenterParams["options"]): SelectOption[] {
        if (!options) {
            return [];
        }

        return options.map(option => {
            if (typeof option === "string") {
                return SelectOption.createFromString(option);
            }
            return SelectOption.create(option);
        });
    }
}

export { SelectPresenter, type ISelectPresenter, type SelectPresenterParams };
