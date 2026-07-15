export const getNumberEnvVariable = (name: string, def: number): number => {
    const input = process.env[name];
    const value = Number(input);
    if (isNaN(value)) {
        return def;
    } else if (value <= 0) {
        return def;
    }
    return value;
};
