type TextOperators<TType extends string> = {
    "": TType;
    _not: TType;
    _in: TType[];
    _not_in: TType[];
    _contains: TType;
};

export type TextInterfaceGenerator<TName extends string, TType extends string = string> = {
    [K in keyof TextOperators<TType> as `${TName}${K}`]?: TextOperators<TType>[K];
};
