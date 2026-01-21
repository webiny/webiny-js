type Numeric = {
    "": number;
    _gt: number;
    _gte: number;
    _lt: number;
    _lte: number;
    _between: [number, number];
};

export type NumericInterfaceGenerator<Name extends string> = {
    [K in keyof Numeric as `${Name}${K}`]?: Numeric[K];
};
