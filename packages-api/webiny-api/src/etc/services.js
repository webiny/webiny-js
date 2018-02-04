// @flow
class Services {
    services: { [string]: { factory: Function, singleton: boolean, tags: Array<string> } };
    instances: Object;

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
    add(
        name: string,
        factory: Function,
        singleton: boolean = true,
        tags: Array<string> = []
    ): void {
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
    get(name: string): any {
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

    getByTag(tag: string, interf: any = null): Array<any> {
        const services: Array<any> = [];
        Object.keys(this.services).forEach((name: string) => {
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
