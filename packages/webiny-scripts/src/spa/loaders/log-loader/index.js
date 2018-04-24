export default function log(source) {
    if (this.cacheable) {
        this.cacheable();
    }

    console.log(this.resourcePath);

    return source;
}
