import _ from 'lodash';
import Webiny from './../../Webiny';

class DepsScanner {
    scan(entry) {
        return this.load(entry).then(acc => console.log(acc));
    }

    load(entry, accumulator = []) {
        return Webiny.import([entry]).then(modules => {
            const cmp = modules[entry];
            if (cmp.options && cmp.options.modules) {
                // scan only custom dependencies
                let deps = Promise.resolve(accumulator);
                _.map(cmp.options.modules, dep => {
                    if (_.isPlainObject(dep)) {
                        _.each(dep, path => {
                            if (!accumulator.includes(path)) {
                                accumulator.push(path);
                            }
                            deps = deps.then(accumulator => this.load(path, accumulator));
                        })
                    }
                });
                return deps;
            }
            return accumulator;
        });
    }
}

export default DepsScanner;