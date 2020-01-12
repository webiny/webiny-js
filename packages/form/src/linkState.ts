import { noop } from "lodash";
import { set } from "lodash/fp";

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
