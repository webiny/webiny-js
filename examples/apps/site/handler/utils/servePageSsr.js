import createResponse from "./createResponse";

const servePageSsr = async key => {
    const LambdaClient = require("aws-sdk/clients/lambda");
    const Lambda = new LambdaClient();
    const params = {
        FunctionName: process.env.SSR_FUNCTION,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({ url: "/" + key })
    };

    await console.log("dohvacam SSR");
    const { Payload } = await Lambda.invoke(params).promise();
    const { html } = JSON.parse(Payload);
    await console.log("dobio SSR");

    return createResponse({
        type: "text/html",
        body: html,
        isBase64Encoded: false,
        headers: { "Cache-Control": "no-store" }
    });
};

export default servePageSsr;
