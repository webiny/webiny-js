import noop from "lodash/noop";
import set from "lodash/fp/set";

export const linkState = (component: any, key: string) => {
    return (value: any, inlineCallback: Function = noop): Promise<any> => {
        return new Promise(resolve => {
            component.setState(
                state => set(key, value, state),
                () => {
                    if (typeof inlineCallback === "function") {
                        inlineCallback(value);
                    }
                    resolve(value);
                }
            );
        });
    };
};
