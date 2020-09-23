import { HandlerApolloGatewayHeadersPlugin } from "./../types";
import { HandlerContext } from "@webiny/handler/types";

const buildHeaders = ({ headers }) => {
    return {
        "Content-Type": headers["content-type"] || headers["Content-Type"],
        Accept: headers["accept"] || headers["Accept"],
        "Accept-Encoding": headers["accept-encoding"] || headers["Accept-Encoding"],
        "Accept-Language": headers["accept-language"] || headers["Accept-Language"],
        Authorization: headers["authorization"] || headers["Authorization"]
    };
};

export default (context: HandlerContext) => {
    const headers = buildHeaders(context.http);

    const headerPlugins = context.plugins.byType<HandlerApolloGatewayHeadersPlugin>(
        "handler-apollo-gateway-headers"
    );
    headerPlugins.forEach(pl => pl.buildHeaders({ headers, context }));

    return headers;
};
