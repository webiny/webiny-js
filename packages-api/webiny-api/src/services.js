class Services {
    constructor() {
        this.services = {};
        this.instances = {};
    }

    add(name, factory, singleton = true, tags = []) {
        this.services[name] = {
            factory,
            singleton,
            tags
        };
    }

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
        Object.keys(this.services).forEach(name => {
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

export default Services;