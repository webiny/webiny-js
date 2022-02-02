import { get } from "dot-prop-immutable";

export function interpolateValue(value: string, data: Record<string, any>) {
    /**
     * TS is complaining about matchAll on string. Says we need to switch to es2020 compiler
     */
    // TODO @ts-refactor
    // @ts-ignore
    const placeholders: string[] = Array.from(value.matchAll(/\$\{([a-zA-Z\.]+)\}/g));

    let interpolated = value;

    for (let j = 0; j < placeholders.length; j++) {
        const [replace, path] = placeholders[j];
        interpolated = interpolated.replace(replace, get(data, path));
    }

    return interpolated;
}
