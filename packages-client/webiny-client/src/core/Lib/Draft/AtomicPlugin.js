import BasePlugin from './BasePlugin';

class AtomicPlugin extends BasePlugin {
    constructor(config) {
        super(config);
    }

    createBlock() {
        throw Error('Implement "createBlock" method in your plugin class!');
    }
}

export default AtomicPlugin;