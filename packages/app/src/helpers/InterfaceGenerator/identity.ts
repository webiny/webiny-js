type IdentityOps<TId> = {
    "": TId;
    _not: TId;
    _in: TId[];
    _not_in: TId[];
};

export type IdentityInterfaceGenerator<Name extends string, TId = string> = {
    [K in keyof IdentityOps<TId> as `${Name}${K}`]?: IdentityOps<TId>[K];
};
