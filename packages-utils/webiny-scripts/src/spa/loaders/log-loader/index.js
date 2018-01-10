'use strict';
module.exports = function (source) {
    if (this.cacheable) {
        this.cacheable();
    }

    console.log(this.resourcePath);

    return source;
};
