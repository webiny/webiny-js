export default ({ headers }) => {
    return {
        "Content-Type": headers["content-type"] || headers["Content-Type"],
        Accept: headers["accept"] || headers["Accept"],
        "Accept-Encoding": headers["accept-encoding"] || headers["Accept-Encoding"],
        "Accept-Language": headers["accept-language"] || headers["Accept-Language"],
        Authorization: headers["authorization"] || headers["Authorization"]
    };
};
