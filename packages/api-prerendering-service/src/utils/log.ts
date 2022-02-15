export default (namespace: string, message: string, ...rest: any[]) =>
    console.log(`api-prerendering-service:${namespace} ${message}`, ...rest);
