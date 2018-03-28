// @flow

class ModalService {
    modals: { [name: string]: any };

    constructor() {
        this.modals = {};
    }

    show(name: string): Promise<void> {
        return this.modals[name].show();
    }

    hide(name: string): Promise<void> {
        return this.modals[name].hide();
    }

    get(name: string) {
        return this.modals[name];
    }

    register(name: string, instance: any) {
        this.modals[name] = instance;
    }

    unregister(name: string) {
        delete this.modals[name];
    }
}

export default ModalService;
