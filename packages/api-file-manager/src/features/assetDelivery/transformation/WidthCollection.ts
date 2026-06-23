export class WidthCollection {
    private readonly values: number[];

    public static create(values: number[]) {
        return new WidthCollection(values);
    }

    private constructor(values: number[]) {
        this.values = values.sort((a, b) => a - b);
    }

    public max() {
        return Math.max(...this.values);
    }

    public min() {
        return Math.min(...this.values);
    }

    public getClosestOrMax(value: number | undefined): number {
        if (!value) {
            return this.max();
        }
        const gteGivenValue = this.values.filter(w => w >= value);
        return gteGivenValue.length > 0 ? gteGivenValue[0] : this.max();
    }
}
