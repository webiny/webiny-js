import { makeAutoObservable } from "mobx";
import {
    ProgressItem,
    type ProgressItemParams,
    ProgressItemFormatter,
    type ProgressItemFormatted
} from "../domains";

interface SteppedProgressPresenterParams {
    items: ProgressItemParams[];
}

interface ISteppedProgressPresenter {
    vm: {
        items: ProgressItemFormatted[];
    };
    init: (props: SteppedProgressPresenterParams) => void;
}

class SteppedProgressPresenter implements ISteppedProgressPresenter {
    private items: ProgressItem[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    public init(params: SteppedProgressPresenterParams) {
        this.items = params.items.map(item => ProgressItem.create(item));
    }

    get vm() {
        return {
            items: this.items.map(item => ProgressItemFormatter.format(item))
        };
    }
}

export { SteppedProgressPresenter, type SteppedProgressPresenterParams };
