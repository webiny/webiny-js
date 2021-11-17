console.log("TenantRouter was loaded!")

module.exports.handler = async event => {
    console.log("TenantRouter was invoked!")
    const request = event.Records[0].cf.request;
    console.log("request", request);

    return request;
};
