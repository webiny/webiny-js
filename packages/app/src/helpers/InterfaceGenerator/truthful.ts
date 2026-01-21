type Truthful = {
    "": boolean;
};

export type TruthfulInterfaceGenerator<Name extends string> = {
    [K in keyof Truthful as `${Name}${K}`]?: Truthful[K];
};
