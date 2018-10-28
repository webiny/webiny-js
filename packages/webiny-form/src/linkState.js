import { get, noop } from "lodash";
import { set } from "lodash/fp";

export default (component, key, defaultValue = null) => {
    const getValue = key => {
        return get(component.state, key, defaultValue);
    };

    return {
        /**
         * Current state value
         */
        value: getValue(key),
        /**
         * onChange callback
         *
         * @param value New value to set.
         * @param inlineCallback A callback to execute with the new and old values, after the state is updated.
         * @returns {Promise<any>}
         */
        onChange: (value, inlineCallback = noop) => {
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
        }
    };
};
