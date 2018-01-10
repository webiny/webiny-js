'use strict';
export default  function (source) {
    if (this.cacheable) {
        this.cacheable();
    }

    console.log(this.resourcePath);

    return source;
};
