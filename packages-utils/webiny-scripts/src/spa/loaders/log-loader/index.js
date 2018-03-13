export default source => {
    if (this.cacheable) {
        this.cacheable();
    }

    console.log(this.resourcePath);

    return source;
};
