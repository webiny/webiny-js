import { makeAutoObservable } from "mobx";

interface ProgressBarPresenterParams {
    value?: number | null;
    max?: number;
    getValueLabel?: (value: number, max: number) => string;
}

interface ProgressBarVm {
    value: number;
    /** The fill percentage (0–100), i.e. `value` scaled by `max`. This is what the bar renders. */
    percent: number;
    textValue: string;
    min: number;
    textMin: string;
    max: number;
    textMax: string;
}

interface IProgressBarPresenter {
    get vm(): ProgressBarVm;
    init: (params: ProgressBarPresenterParams) => void;
}

class ProgressBarPresenter implements IProgressBarPresenter {
    private params?: ProgressBarPresenterParams = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    init(params: ProgressBarPresenterParams) {
        this.params = params;
    }

    get vm(): ProgressBarVm {
        return {
            value: this.value,
            percent: this.percent,
            textValue: this.getValueLabel(this.value, this.max),
            min: this.min,
            textMin: String(this.min),
            max: this.max,
            textMax: String(this.max)
        };
    }

    private get value(): number {
        return this.params?.value ?? 0;
    }

    /** `value` scaled to a 0–100 fill percentage. Clamped, and guarded against a zero/absent max. */
    private get percent(): number {
        if (this.max <= 0) {
            return 0;
        }
        return Math.min(100, Math.max(0, (this.value / this.max) * 100));
    }

    private get min(): number {
        return 0;
    }

    private get max(): number {
        return this.params?.max ?? 100;
    }

    private getValueLabel(value: number, max: number): string {
        if (this.params?.getValueLabel) {
            return this.params.getValueLabel(value, max);
        }
        return `${Math.round((value / max) * 100)}%`;
    }
}

export { ProgressBarPresenter, type ProgressBarVm, type ProgressBarPresenterParams };
