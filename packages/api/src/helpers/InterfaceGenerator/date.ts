type DateOps<T> = {
    "": T;
    _gt: T;
    _gte: T;
    _lt: T;
    _lte: T;
    _between: [T, T];
};

export type DateInterfaceGenerator<Name extends string> = {
    [K in keyof DateOps<Date> as `${Name}${K}`]?: DateOps<Date>[K];
};

export type DateStringInterfaceGenerator<Name extends string> = {
    [K in keyof DateOps<string> as `${Name}${K}`]?: DateOps<string>[K];
};
