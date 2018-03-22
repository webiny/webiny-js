import ExtractTextPlugin from "extract-text-webpack-plugin";

const extractCss = ExtractTextPlugin.extract({
    fallback: "style-loader",
    use: ["css-loader", "resolve-url-loader", "sass-loader?sourceMap"]
});

export default () => {
    return {
        test: /\.s?css$/,
        oneOf: [
            // 1. Convert all styles not located in Assets folder to CSS modules.
            {
                exclude: /assets/,
                resourceQuery: query => !query.includes("extract"),
                issuer: /\.jsx?$/,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            modules: true,
                            importLoaders: 3,
                            localIdentName: "[folder]_[local]"
                        }
                    },
                    "resolve-url-loader",
                    "sass-loader?sourceMap"
                ]
            },
            // 2. Extract styles from Assets folder into external CSS file
            {
                issuer: /\.jsx?$/,
                include: /assets/,
                use: extractCss
            },
            // 3. Files with '?extract' query will also be extracted into external CSS file
            {
                issuer: /\.jsx?$/,
                resourceQuery: /extract/,
                use: extractCss
            }
        ]
    };
};
