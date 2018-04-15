import _ from "lodash";

export default (component, key, callback, defaultValue = null) => {
    const getValue = key => {
        return _.get(component.state, key, defaultValue);
    };

    return {
        value: getValue(key),
        onChange: (value, inlineCallback = _.noop) => {
            return new Promise(resolve => {
                const oldValue = getValue(key);

                let promise = Promise.resolve(value);
                if (callback) {
                    promise = Promise.resolve(callback(value, oldValue)).then(newValue => {
                        return newValue === undefined ? value : newValue;
                    });
                }

                return promise.then(value => {
                    component.setState(
                        state => {
                            _.set(state, key, value);
                            return state;
                        },
                        () => {
                            if (_.isFunction(inlineCallback)) {
                                inlineCallback(value, oldValue);
                            }
                            resolve(value);
                        }
                    );
                });
            });
        }
    };
};
