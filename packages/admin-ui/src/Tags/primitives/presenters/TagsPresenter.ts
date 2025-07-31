import { makeAutoObservable } from "mobx";
import { type ITagsInputPresenter } from "./TagsInputPresenter";
import { type ITagsValuesPresenter } from "./TagsValuesPresenter";

interface TagsPresenterParams {
    values?: string[];
    protectedValues?: string[];
    onValueChange?: (values: string[]) => void;
    onValueInput?: (value: string) => void;
    onValueAdd?: (value: string) => void;
    onValueRemove?: (value: string) => void;
    placeholder?: string;
}

interface ITagsPresenter {
    vm: {
        inputVm: ITagsInputPresenter["vm"];
        valuesVm: ITagsValuesPresenter["vm"];
    };
    init: (params: TagsPresenterParams) => void;
    inputValue: (value: string) => void;
    addValue: (value: string) => void;
    removeValue: (value: string) => void;
}

class TagsPresenter implements ITagsPresenter {
    private params?: TagsPresenterParams = undefined;
    private inputPresenter: ITagsInputPresenter;
    private valuesPresenter: ITagsValuesPresenter;

    constructor(inputPresenter: ITagsInputPresenter, valuesPresenter: ITagsValuesPresenter) {
        this.inputPresenter = inputPresenter;
        this.valuesPresenter = valuesPresenter;
        makeAutoObservable(this);
    }

    init(params: TagsPresenterParams) {
        this.params = params;
        this.inputPresenter.init({ placeholder: params.placeholder });
        this.valuesPresenter.init({
            values: params.values,
            protectedValues: params.protectedValues
        });
    }

    get vm() {
        return {
            inputVm: this.inputPresenter.vm,
            valuesVm: this.valuesPresenter.vm
        };
    }

    public inputValue = (value: string) => {
        this.inputPresenter.setValue(value);
        if (this.params?.onValueInput) {
            this.params.onValueInput(value);
        }
    };

    public addValue = () => {
        const value = this.vm.inputVm.value.trim();

        if (!value) {
            return;
        }

        this.inputPresenter.setValue("");

        if (this.valuesPresenter.hasValue(value)) {
            // If the value already exists, do not add it again
            return;
        }

        this.valuesPresenter.addValue(value);

        if (this.params?.onValueAdd) {
            this.params.onValueAdd(value);
        }

        if (this.params?.onValueChange) {
            this.params.onValueChange(this.getValues());
        }
    };

    public removeValue = (value: string) => {
        this.valuesPresenter.removeValue(value);

        if (this.valuesPresenter.isValueProtected(value)) {
            // If the value is protected, do not remove it
            return;
        }

        if (this.params?.onValueRemove) {
            this.params.onValueRemove(value);
        }

        if (this.params?.onValueChange) {
            this.params.onValueChange(this.getValues());
        }
    };

    private getValues = () => {
        return this.valuesPresenter.vm.values.map(tag => tag.label);
    };
}

export { TagsPresenter, type ITagsPresenter, type TagsPresenterParams };
