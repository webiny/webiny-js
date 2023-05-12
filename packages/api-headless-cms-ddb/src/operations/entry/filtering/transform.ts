import { Field } from "./types";

interface Params extends Pick<Field, "transform"> {
    value: any;
}
export const transformValue = ({ value, transform }: Params): any => {
    if (Array.isArray(value)) {
        return value.map(v => transform(v));
    }
    return transform(value);
};
