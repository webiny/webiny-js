import { noop } from "lodash";
import { set } from "lodash/fp";

export const linkState = (component: any, key: string) => {
    return (value: any, inlineCallback: Function = noop): Promise<any> => {
        return new Promise(resolve => {
            component.setState(
                /**
                 * We do not know which type of state can this be, so we use any.
                 */
                (state: any) => set(key, value, state),
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
