import { get, noop } from "lodash";
import { set } from "lodash/fp";

export default (component, key, callback, defaultValue = null) => {
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
                const oldValue = getValue(key);

                if (callback) {
                    const newValue = callback(value, oldValue);
                    value = newValue === undefined ? value : newValue;
                }

                component.setState(
                    state => set(key, value, state),
                    () => {
                        if (typeof inlineCallback === "function") {
                            inlineCallback(value, oldValue);
                        }
                        resolve(value);
                    }
                );
            });
        }
    };
};
