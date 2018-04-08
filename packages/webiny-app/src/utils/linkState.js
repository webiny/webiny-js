import _ from "lodash";

export default (component, key, callback, defaultValue = null) => {
    const getValue = key => {
        return _.get(component.state, key, defaultValue);
    };

    const createStateKeySetter = () => {
        return function stateKeySetter(value, inlineCallback = _.noop) {
            return new Promise(resolve => {
                if (typeof value === "undefined") {
                    value = false;
                }
                const oldValue = getValue(key);

                let promise = Promise.resolve(value);
                if (callback) {
                    promise = Promise.resolve(callback(value, oldValue)).then(newValue => {
                        return newValue === undefined ? value : newValue;
                    });
                }

                return promise.then(value => {
                    let partialState = component.state;
                    _.set(partialState, key, value);
                    component.setState(partialState, () => {
                        if (_.isFunction(inlineCallback)) {
                            inlineCallback(value, oldValue);
                        }
                        partialState = null;
                        resolve(value);
                    });
                });
            });
        };
    };

    return {
        value: getValue(key),
        onChange: createStateKeySetter()
    };
};
