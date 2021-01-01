export default (namespace, message, ...rest) =>
    console.log(`api-prerendering-service:${namespace} ${message}`, ...rest);
