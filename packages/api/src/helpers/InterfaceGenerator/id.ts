type IdOperators<TType extends string> = {
    "": TType;
    _not: TType;
    _in: TType[];
    _not_in: TType[];
};

export type IdInterfaceGenerator<TName extends string, TType extends string = string> = {
    [K in keyof IdOperators<TType> as `${TName}${K}`]?: IdOperators<TType>[K];
};

type IdMixedOperators = {
    "": string;
    _not: string;
    _in: string[];
    _not_in: string[];
    _gt: number | string;
    _gte: number | string;
    _lt: number | string;
    _lte: number | string;
};

export type IdMixedInterfaceGenerator<TName extends string> = {
    [K in keyof IdMixedOperators as `${TName}${K}`]?: IdMixedOperators[K];
};
