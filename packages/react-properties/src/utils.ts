import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdef", 6);
import { Property } from "./Properties";

function buildRoots(roots: Property[], properties: Property[]) {
    const obj: Record<string, unknown> = roots.reduce((acc, item) => {
        const isArray = item.array === true || roots.filter(r => r.name === item.name).length > 1;
        return { ...acc, [item.name]: isArray ? [] : {} };
    }, {});

    roots.forEach(root => {
        const isArray = root.array === true || Array.isArray(obj[root.name]);
        if (root.value !== undefined) {
            obj[root.name] = isArray ? [...(obj[root.name] as Array<any>), root.value] : root.value;
            return;
        }

        const nextRoots = properties.filter(p => p.parent === root.id);
        const value = buildRoots(nextRoots, properties);
        obj[root.name] = isArray ? [...(obj[root.name] as Property[]), value] : value;
    });

    return obj;
}

export function toObject<T = unknown>(properties: Property[]): T {
    const roots = properties.filter(prop => prop.parent === "");
    return buildRoots(roots, properties) as T;
}

export function getUniqueId() {
    return nanoid();
}
