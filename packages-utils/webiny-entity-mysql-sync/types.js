export type Column = {
    type: "bigint" | "char" | "tinyint" | "bool" | "varchar" | "enum",
    unsigned?: boolean,
    allowNull?: boolean
};

export type Table = {
    name: string,
    columns: { [string]: Column }
};
