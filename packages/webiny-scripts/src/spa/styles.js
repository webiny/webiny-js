import ExtractTextPlugin from "extract-text-webpack-plugin";
import loaderUtils from "loader-utils";

export default () => {
    return {
        test: /\.s?css$/,
        oneOf: [
            {
                issuer: /\.jsx?$/,
                resourceQuery: /extract/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: ["css-loader", "resolve-url-loader", "sass-loader?sourceMap"]
                })
            },
            {
                issuer: /\.jsx?$/,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            modules: true,
                            importLoaders: 2,
                            getLocalIdent(context, localIdentName, localName) {
                                const query = loaderUtils.parseQuery(context.resourceQuery || "?");
                                return query.prefix ? query.prefix + "_" + localName : localName;
                            }
                        }
                    },
                    "resolve-url-loader",
                    "sass-loader?sourceMap"
                ]
            }
        ]
    };
};
