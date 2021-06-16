import { get } from "dot-prop-immutable";

export function interpolateValue(value, data) {
    const placeholders: string[] = Array.from(value.matchAll(/\$\{([a-zA-Z\.]+)\}/g));

    let interpolated = value;

    for (let j = 0; j < placeholders.length; j++) {
        const [replace, path] = placeholders[j];
        interpolated = interpolated.replace(replace, get(data, path));
    }

    return interpolated;
}
