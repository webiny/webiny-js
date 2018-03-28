"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ServiceManager {
    constructor() {
        this.services = {};
        this.instances = {};
    }

    /**
     * Add service
     * @param name
     * @param factory
     * @param singleton
     * @param tags
     */
    add(name, factory, singleton = true, tags = []) {
        this.services[name] = {
            factory,
            singleton,
            tags
        };
    }

    /**
     * Get service
     * @param name
     * @return {*}
     */
    get(name) {
        const service = this.services[name];
        let instance = this.instances[name];

        if (!service) {
            return undefined;
        }

        if (!instance || !service.singleton) {
            instance = service.factory();
        }

        if (service.singleton) {
            this.instances[name] = instance;
        }

        return instance;
    }

    getByTag(tag, interf = null) {
        const services = [];
        (0, _keys2.default)(this.services).forEach(name => {
            const service = this.services[name];
            if (service.tags.includes(tag)) {
                const instance = this.get(name);
                if (!interf || (interf && instance instanceof interf)) {
                    services.push(instance);
                }
            }
        });
        return services;
    }
}

exports.default = ServiceManager;
//# sourceMappingURL=serviceManager.js.map
