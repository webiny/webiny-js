import usePrevious from "./usePrevious";
import isEqual from "lodash/isEqual";

export default function <T>(value: T) {
    const previousValue = usePrevious<T>(value);

    return !isEqual(previousValue, value);
}
