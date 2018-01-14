import _ from 'lodash';

class LinkState {

    constructor(component, key, callback, defaultValue = null) {
        this.component = component;
        this.key = key;
        this.callback = callback;
        this.defaultValue = defaultValue;
    }

    create() {
        return {
            value: this.__getValue(this.key),
            onChange: this.__createStateKeySetter()
        };
    }

    __getValue(key) {
        return _.get(this.component.state, key, this.defaultValue);
    }

    __createStateKeySetter() {
        const component = this.component;
        const key = this.key;

        const _this = this;
        return function stateKeySetter(value, callback = _.noop) {
            return new Promise(resolve => {
                if (typeof value === 'undefined') {
                    value = false;
                }
                const oldValue = _this.__getValue(key);

                let promise = Promise.resolve(value);
                if (_this.callback) {
                    promise = Promise.resolve(_this.callback(value, oldValue)).then(newValue => {
                        return newValue === undefined ? value : newValue;
                    });
                }

                return promise.then(value => {
                    let partialState = component.state;
                    _.set(partialState, key, value);
                    component.setState(partialState, () => {
                        if (_.isFunction(callback)) {
                            callback(value, oldValue);
                        }
                        partialState = null;
                        resolve(value);
                    });
                });
            });
        };
    }
}

export default LinkState;
