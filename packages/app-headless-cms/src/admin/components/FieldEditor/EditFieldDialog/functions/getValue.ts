import get from "lodash/get";

interface Params {
    bind: any;
    index: number;
    name: string;
}
const getValue = (params: Params): string[] | undefined => {
    const { bind, index, name } = params;
    const value = bind.value || [];

    if (index >= 0) {
        return get(value, `${index}.${name}`);
    }

    return value;
};

export default getValue;
