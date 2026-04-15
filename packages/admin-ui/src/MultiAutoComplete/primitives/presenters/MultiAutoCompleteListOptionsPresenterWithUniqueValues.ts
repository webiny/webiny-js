import type { CommandOption } from "~/Command/domain/CommandOption.js";
import type {
    IMultiAutoCompleteListOptionsPresenter,
    IMultiAutoCompleteListOptionsPresenterParams
} from "./MultiAutoCompleteListOptionsPresenter.js";

export class MultiAutoCompleteListOptionsPresenterWithUniqueValues
    implements IMultiAutoCompleteListOptionsPresenter
{
    private decoretee: IMultiAutoCompleteListOptionsPresenter;

    constructor(decoretee: IMultiAutoCompleteListOptionsPresenter) {
        this.decoretee = decoretee;
    }

    init(params: IMultiAutoCompleteListOptionsPresenterParams) {
        const options = params.options?.filter(option => !option.selected);
        this.decoretee.init({
            ...params,
            options
        });
    }

    get vm() {
        return this.decoretee.vm;
    }

    setListOpenState = (open: boolean) => {
        this.decoretee.setListOpenState(open);
    };

    setLoadedOptions = (loaded: boolean) => {
        this.decoretee.setLoadedOptions(loaded);
    };

    setSelectedOption = (value: string) => {
        this.decoretee.setSelectedOption(value);
    };

    removeSelectedOption = (value: string) => {
        this.decoretee.removeSelectedOption(value);
    };

    resetSelectedOptions = () => {
        this.decoretee.resetSelectedOptions();
    };

    addOption = (option: CommandOption) => {
        this.decoretee.addOption(option);
    };
}
