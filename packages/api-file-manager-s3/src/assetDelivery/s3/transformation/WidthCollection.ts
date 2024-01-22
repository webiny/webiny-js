export class WidthCollection {
    private readonly values: number[];

    constructor(values: number[]) {
        this.values = values.sort((a, b) => a - b);
    }

    max() {
        return Math.max(...this.values);
    }

    min() {
        return Math.min(...this.values);
    }

    getClosestOrMax(value: number | undefined): number {
        if (!value) {
            return this.max();
        }
        const gteGivenValue = this.values.filter(w => w >= value);
        return gteGivenValue.length > 0 ? gteGivenValue[0] : this.max();
    }
}
