// TODO @ts-refactor figure out correct bind types and remove any
import set from "lodash/set";

interface Params {
    value: string[];
    bind: any;
    index: number;
    name: string;
}
const setValue = (params: Params): void => {
    const { value, bind, index, name } = params;
    let newValue = [...(bind.value || [])];
    if (index >= 0) {
        set(newValue, `${index}.${name}`, value);
    } else {
        newValue = value;
    }
    bind.onChange(newValue);
};

export default setValue;
