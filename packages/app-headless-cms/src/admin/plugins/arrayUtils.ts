/**
 * Remove array value at given index.
 */
export function removeValueAtIndex(value: any[], index: number) {
    if (index < 0) {
        return;
    }

    return [...value.slice(0, index), ...value.slice(index + 1)];
}

/**
 * Move array value at given index to the left.
 */
export function pullValueAtIndex(value: any[], index: number) {
    if (index <= 0) {
        return value;
    }

    const newValue = [...value];
    newValue.splice(index, 1);
    newValue.splice(index - 1, 0, value[index]);
    return newValue;
}

/**
 * Move array value at given index to the right.
 */
export function pushValueAtIndex(value: any[], index: number) {
    if (index >= value.length) {
        return value;
    }

    const newValue = [...value];
    newValue.splice(index, 1);
    newValue.splice(index + 1, 0, value[index]);
    return newValue;
}
