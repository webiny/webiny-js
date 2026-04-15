import { makeAutoObservable } from "mobx";
import { CommandOption } from "~/Command/domain/CommandOption.js";
import type { CommandOptionFormatted } from "~/Command/domain/CommandOptionFormatted.js";
import { CommandOptionFormatter } from "~/Command/domain/CommandOptionFormatter.js";

export interface IMultiAutoCompleteTemporaryOptionPresenter {
    vm: {
        option?: CommandOptionFormatted;
    };
    init: () => void;
    setOption: (value: string) => void;
    resetOption: () => void;
}

export class MultiAutoCompleteTemporaryOptionPresenter
    implements IMultiAutoCompleteTemporaryOptionPresenter
{
    private option?: CommandOption = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    init() {
        return;
    }

    get vm() {
        return {
            option: this.option ? CommandOptionFormatter.format(this.option) : undefined
        };
    }

    public setOption = (value: string) => {
        this.option = CommandOption.createFromString(value);
    };

    public resetOption = () => {
        this.option = undefined;
    };
}
