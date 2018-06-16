import ExtractTextPlugin from "extract-text-webpack-plugin";

export default () => {
    return {
        test: /\.s?css$/,
        oneOf: [
            {
                exclude: /\.module\.s?css$/,
                issuer: /\.jsx?$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: ["css-loader", "resolve-url-loader", "sass-loader?sourceMap"]
                })
            },
            {
                include: /\.module\.s?css$/,
                issuer: /\.jsx?$/,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            modules: true,
                            importLoaders: 2
                        }
                    },
                    "resolve-url-loader",
                    "sass-loader?sourceMap"
                ]
            }
        ]
    };
};
