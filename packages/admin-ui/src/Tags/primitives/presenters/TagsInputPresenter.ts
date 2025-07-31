import { makeAutoObservable } from "mobx";

export interface TagsInputPresenterParams {
    placeholder?: string;
}

export interface ITagsInputPresenter {
    vm: {
        placeholder: string;
        value: string;
    };
    init: (params: TagsInputPresenterParams) => void;
    setValue: (query: string) => void;
}

export class TagsInputPresenter implements ITagsInputPresenter {
    private value?: string = undefined;
    private placeholder?: string = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    init(params?: TagsInputPresenterParams) {
        this.placeholder = params?.placeholder;
    }

    get vm() {
        return {
            placeholder: this.placeholder || "",
            value: this.value || ""
        };
    }

    public setValue = (value: string) => {
        this.value = value;
    };
}
