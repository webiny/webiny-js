import { computed, makeAutoObservable } from "mobx";
import slugify from "slugify";
import {
    ExperimentFormPresenter as Abstraction,
    type ExperimentFormInitial,
    type FormBucket,
    type IExperimentFormPresenter,
    type IExperimentFormViewModel,
    type NewExperimentPayload
} from "./abstractions/ExperimentFormPresenter.js";

const toKey = (value: string): string => slugify(value, { lower: true, strict: true });

const defaultBuckets = (): FormBucket[] => [
    {
        id: "control",
        isControl: true,
        name: "Control",
        key: "control",
        keyEdited: false,
        description: "",
        weight: 50
    },
    {
        id: crypto.randomUUID(),
        isControl: false,
        name: "Variant B",
        key: "variant-b",
        keyEdited: false,
        description: "",
        weight: 50
    }
];

/** Even split summing to 100, with any remainder distributed from the first bucket. */
const evenSplit = (buckets: FormBucket[]): FormBucket[] => {
    const n = buckets.length;
    const each = Math.floor(100 / n);
    const next = buckets.map(b => ({ ...b, weight: each }));
    let used = each * n;
    let i = 0;
    while (used < 100) {
        next[i % n].weight += 1;
        used++;
        i++;
    }
    return next;
};

/** Set one bucket's weight and auto-balance the rest (proportionally) so the total stays 100. */
const rebalance = (buckets: FormBucket[], index: number, rawValue: number): FormBucket[] => {
    const value = Math.max(0, Math.min(100, Math.round(rawValue)));
    const next = buckets.map(b => ({ ...b }));
    next[index].weight = value;

    const others = next.map((b, i) => ({ b, i })).filter(x => x.i !== index);
    if (others.length === 0) {
        next[index].weight = 100;
        return next;
    }

    const remaining = 100 - value;
    const sumOthers = others.reduce((sum, x) => sum + x.b.weight, 0);

    if (sumOthers <= 0) {
        const each = Math.floor(remaining / others.length);
        others.forEach(x => (next[x.i].weight = each));
        let used = each * others.length;
        let k = 0;
        while (used < remaining) {
            next[others[k % others.length].i].weight += 1;
            used++;
            k++;
        }
    } else {
        let allocated = 0;
        others.forEach(x => {
            const w = Math.max(0, Math.round((x.b.weight / sumOthers) * remaining));
            next[x.i].weight = w;
            allocated += w;
        });
        const drift = remaining - allocated;
        if (drift !== 0) {
            const largest = others.reduce((a, b) => (next[a.i].weight >= next[b.i].weight ? a : b));
            next[largest.i].weight = Math.max(0, next[largest.i].weight + drift);
        }
    }

    return next;
};

class ExperimentFormPresenterImpl implements IExperimentFormPresenter {
    private _name = "";
    private _key = "";
    private _keyEdited = false;
    private _buckets: FormBucket[] = defaultBuckets();
    private _submitLabel = "Create experiment";
    private _allowStructureChange = true;
    private _onSubmit: (payload: NewExperimentPayload) => void = () => {
        return;
    };

    public constructor() {
        makeAutoObservable(this, { vm: computed });
    }

    public get vm(): IExperimentFormViewModel {
        const total = this._buckets.reduce((sum, b) => sum + b.weight, 0);
        const variantCount = this._buckets.filter(b => !b.isControl).length;
        const canSubmit = this._name.trim().length > 0 && this._key.trim().length > 0;

        return {
            name: this._name,
            key: this._key,
            buckets: this._buckets,
            total,
            variantCount,
            canSubmit,
            submitLabel: this._submitLabel,
            allowStructureChange: this._allowStructureChange
        };
    }

    public init(
        initial: ExperimentFormInitial | undefined,
        options: {
            submitLabel: string;
            allowStructureChange: boolean;
            onSubmit: (payload: NewExperimentPayload) => void;
        }
    ): void {
        this._name = initial?.name ?? "";
        this._key = initial?.key ?? "";
        this._keyEdited = Boolean(initial?.key);
        this._buckets = initial?.buckets ?? defaultBuckets();
        this._submitLabel = options.submitLabel;
        this._allowStructureChange = options.allowStructureChange;
        this._onSubmit = options.onSubmit;
    }

    public setName(value: string): void {
        this._name = value;
        if (!this._keyEdited) {
            this._key = toKey(value);
        }
    }

    public setKey(value: string): void {
        this._keyEdited = true;
        this._key = value;
    }

    public addVariant(): void {
        const count = this._buckets.filter(b => !b.isControl).length;
        const variantName = `Variant ${String.fromCharCode(66 + count)}`;
        this._buckets = evenSplit([
            ...this._buckets,
            {
                id: crypto.randomUUID(),
                isControl: false,
                weight: 0,
                name: variantName,
                key: toKey(variantName),
                keyEdited: false,
                description: ""
            }
        ]);
    }

    public removeVariant(index: number): void {
        this._buckets = evenSplit(this._buckets.filter((_, i) => i !== index));
    }

    public changeWeight(index: number, value: number): void {
        this._buckets = rebalance(this._buckets, index, value);
    }

    public changeName(index: number, value: string): void {
        this._buckets = this._buckets.map((b, i) =>
            i === index ? { ...b, name: value, key: b.keyEdited ? b.key : toKey(value) } : b
        );
    }

    public changeKey(index: number, value: string): void {
        this._buckets = this._buckets.map((b, i) =>
            i === index ? { ...b, key: value, keyEdited: true } : b
        );
    }

    public changeDescription(index: number, value: string): void {
        this._buckets = this._buckets.map((b, i) =>
            i === index ? { ...b, description: value } : b
        );
    }

    public submit(): void {
        const canSubmit = this._name.trim().length > 0 && this._key.trim().length > 0;
        if (!canSubmit) {
            return;
        }
        const control = this._buckets.find(b => b.isControl)!;
        const variants = this._buckets
            .filter(b => !b.isControl)
            .map(b => ({
                id: b.id,
                revisionId: b.revisionId,
                name: b.name,
                key: b.key,
                description: b.description,
                weight: b.weight
            }));

        this._onSubmit({
            name: this._name.trim(),
            key: this._key.trim(),
            control: { key: control.key, description: control.description, weight: control.weight },
            variants
        });
    }
}

export const ExperimentFormPresenter = Abstraction.createImplementation({
    implementation: ExperimentFormPresenterImpl,
    dependencies: []
});
