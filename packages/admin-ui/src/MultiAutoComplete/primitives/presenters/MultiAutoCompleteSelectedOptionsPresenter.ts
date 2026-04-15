import { makeAutoObservable } from "mobx";
import type { CommandOptionFormatted } from "~/Command/domain/CommandOptionFormatted.js";
import { CommandOptionFormatter } from "~/Command/domain/CommandOptionFormatter.js";
import type { CommandOption } from "~/Command/domain/CommandOption.js";
import { ListCache } from "../../domains/index.js";

interface MultiAutoCompleteSelectedOptionsParams {
    options?: CommandOption[];
}

interface IMultiAutoCompleteSelectedOptionsPresenter {
    vm: {
        options: CommandOptionFormatted[];
        empty: boolean;
    };
    init: (params: MultiAutoCompleteSelectedOptionsParams) => void;
    addOption: (option: CommandOption) => void;
    removeOption: (value: string) => void;
    resetOptions: () => void;
}

class MultiAutoCompleteSelectedOptionPresenter
    implements IMultiAutoCompleteSelectedOptionsPresenter
{
    private options = new ListCache<CommandOption>();

    constructor() {
        makeAutoObservable(this);
    }

    init(params: MultiAutoCompleteSelectedOptionsParams) {
        if (params.options?.length) {
            for (const option of params.options) {
                if (!this.options.getItem(o => o.value === option.value)) {
                    this.options.addItems([option]);
                }
            }
        } else {
            // If no options are provided, clear the existing options
            this.options.clear();
        }
    }

    get vm() {
        return {
            options: this.options.getItems().map(option => CommandOptionFormatter.format(option)),
            empty: !this.options.hasItems()
        };
    }

    public addOption = (option: CommandOption) => {
        this.options.addItems([option]);
    };

    public removeOption = (value: string) => {
        this.options.removeItems(option => option.value === value);
    };

    public resetOptions = () => {
        this.options.clear();
    };
}

export {
    MultiAutoCompleteSelectedOptionPresenter,
    type IMultiAutoCompleteSelectedOptionsPresenter,
    type MultiAutoCompleteSelectedOptionsParams
};
