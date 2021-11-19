exports.request = async (event) => {
    const request = event.Records[0].cf.request;
    console.log(JSON.stringify(event.Records[0].cf, null, 2));

    console.log("Original domain", request.headers.host[0].value);
    console.log("Origin domain name", request.origin.custom.domainName);
    
    // Restore the Host header
    request.headers.host[0].value = request.origin.custom.domainName;
    
    return request;
};
