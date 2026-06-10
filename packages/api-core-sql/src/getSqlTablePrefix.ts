export const getSqlTablePrefix = (): string => {
    return process.env.SQL_TABLE_PREFIX || process.env.WEBINY_SQL_TABLE_PREFIX || "";
};
