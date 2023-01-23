export const isJSONObjectString = (value: string): boolean => {
    try {
        const o = JSON.parse(value);
        return !!o && (typeof o === 'object') && !Array.isArray(o)
    } catch {
        return false
    }
}
