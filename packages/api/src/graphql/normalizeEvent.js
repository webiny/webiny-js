export default event => {
    // In AWS, when enabling binary support, on each request via the API gateway, content would be base64 encoded. Did
    // not find a way to solve this correctly, so for now we "normalize" the event before passing it to the handler. It
    // would be nice if we could resolve this issue better / smarter in the future (configure integrations correctly?).
    if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, "base64").toString("utf-8");
    }
};
