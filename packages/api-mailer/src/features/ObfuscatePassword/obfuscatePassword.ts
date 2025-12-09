export function obfuscatePassword(values: Record<string, any>): Record<string, any> {
    // eslint-disable-next-line
    const { password, ...rest } = values;
    return rest;
}
