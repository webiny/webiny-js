import { makeAutoObservable } from "mobx";
import { CommandOption } from "~/Command/domain/CommandOption";
import { MultiAutoCompleteOption } from "../../domains";
import { IMultiAutoCompleteInputPresenter } from "./MultiAutoCompleteInputPresenter";
import { IMultiAutoCompleteSelectedOptionsPresenter } from "./MultiAutoCompleteSelectedOptionsPresenter";
import { IMultiAutoCompleteListOptionsPresenter } from "./MultiAutoCompleteListOptionsPresenter";
import { IMultiAutoCompleteTemporaryOptionPresenter } from "./MultiAutoCompleteTemporaryOptionPresenter";

interface MultiAutoCompletePresenterParams {
    allowFreeInput?: boolean;
    displayResetAction?: boolean;
    emptyMessage?: any;
    loadingMessage?: any;
    initialMessage?: any;
    options?: MultiAutoCompleteOption[];
    placeholder?: string;
    values?: string[];
    onValueSearch?: (value: string) => void;
    onValuesReset?: () => void;
    onValuesChange: (values: string[]) => void;
    onOpenChange?: (open: boolean) => void;
}

interface IMultiAutoCompletePresenter {
    vm: {
        inputVm: IMultiAutoCompleteInputPresenter["vm"];
        selectedOptionsVm: IMultiAutoCompleteSelectedOptionsPresenter["vm"];
        optionsListVm: IMultiAutoCompleteListOptionsPresenter["vm"];
        temporaryOptionVm: IMultiAutoCompleteTemporaryOptionPresenter["vm"];
    };
    init: (params: MultiAutoCompletePresenterParams) => void;
    setListOpenState: (open: boolean) => void;
    searchOption: (value: string) => void;
    setSelectedOption: (value: string) => void;
    removeSelectedOption: (value: string) => void;
    resetSelectedOptions: () => void;
    createOption: (value: string) => void;
}

class MultiAutoCompletePresenter implements IMultiAutoCompletePresenter {
    private params?: MultiAutoCompletePresenterParams = undefined;
    private inputPresenter: IMultiAutoCompleteInputPresenter;
    private selectedOptionsPresenter: IMultiAutoCompleteSelectedOptionsPresenter;
    private optionsListPresenter: IMultiAutoCompleteListOptionsPresenter;

    constructor(
        inputPresenter: IMultiAutoCompleteInputPresenter,
        selectedOptionsPresenter: IMultiAutoCompleteSelectedOptionsPresenter,
        optionsListPresenter: IMultiAutoCompleteListOptionsPresenter
    ) {
        this.inputPresenter = inputPresenter;
        this.selectedOptionsPresenter = selectedOptionsPresenter;
        this.optionsListPresenter = optionsListPresenter;
        makeAutoObservable(this);
    }

    init(params: MultiAutoCompletePresenterParams) {
        this.params = params;

        this.inputPresenter.init({
            placeholder: params.placeholder,
            displayResetAction: params.displayResetAction
        });

        const listOptions = this.getListOptions(params.options, params.values);
        this.optionsListPresenter.init({
            options: listOptions,
            emptyMessage: params.emptyMessage,
            loadingMessage: params.loadingMessage,
            initialMessage: params.initialMessage
        });
        this.selectedOptionsPresenter.init({
            options: this.getSelectedOptions(listOptions, params.values)
        });
    }

    get vm() {
        return {
            inputVm: this.inputPresenter.vm,
            selectedOptionsVm: this.selectedOptionsPresenter.vm,
            optionsListVm: this.optionsListPresenter.vm,
            temporaryOptionVm: {
                option: undefined
            }
        };
    }

    setListOpenState = (open: boolean) => {
        this.optionsListPresenter.setListOpenState(open);
        this.params?.onOpenChange?.(open);
    };

    public searchOption = (value: string) => {
        this.inputPresenter.setValue(value);
        this.optionsListPresenter.setLoadedOptions(true);
        this.params?.onValueSearch?.(value);
    };

    public setSelectedOption = (value: string) => {
        this.inputPresenter.resetValue();
        this.optionsListPresenter.setSelectedOption(value);

        const option = this.vm.optionsListVm.options.find(option => option.value === value);

        const commandOption = option
            ? CommandOption.create(option)
            : CommandOption.createFromString(value);

        commandOption.selected = true;
        this.selectedOptionsPresenter.addOption(commandOption);

        this.params?.onValuesChange(this.getSelectedValues());
    };

    public removeSelectedOption = (value: string) => {
        this.optionsListPresenter.removeSelectedOption(value);
        this.selectedOptionsPresenter.removeOption(value);

        this.params?.onValuesChange(this.getSelectedValues());
    };

    public resetSelectedOptions = () => {
        this.optionsListPresenter.resetSelectedOptions();
        this.selectedOptionsPresenter.resetOptions();
        this.inputPresenter.resetValue();

        this.params?.onValuesChange(this.getSelectedValues());
        this.params?.onValuesReset?.();
    };

    public createOption = () => {
        return;
    };

    private getListOptions(
        options: MultiAutoCompleteOption[] = [],
        values: string[] = []
    ): CommandOption[] {
        return options.map(option => {
            const commandOption =
                typeof option === "string"
                    ? CommandOption.createFromString(option)
                    : CommandOption.create(option);

            commandOption.selected = values?.includes(commandOption.value) ?? false;

            return commandOption;
        });
    }

    private getSelectedOptions(
        commandOptions: CommandOption[],
        values: string[] = []
    ): CommandOption[] {
        if (!values.length) {
            return [];
        }

        return values.map(value => {
            const option = commandOptions.find(option => option.value === value);

            if (!option) {
                return CommandOption.createFromString(value);
            }

            return option;
        });
    }

    private getSelectedValues() {
        return this.selectedOptionsPresenter.vm.options.map(option => option.value);
    }
}

export {
    MultiAutoCompletePresenter,
    type IMultiAutoCompletePresenter,
    type MultiAutoCompletePresenterParams
};
