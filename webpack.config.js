const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;

const resolve = (file) => path.resolve(__dirname, file);

module.exports = (env) => {
    const isProd = env.production == true;
    console.log("isProd:", isProd);

    return {
        target: "web",
        entry: {
            app: resolve("app/index.tsx"),
            report: resolve("report/index.tsx"),
        },
        mode: isProd ? "production" : "development",
        output: {
            path: resolve("dist"),
            publicPath: "/",
            clean: true,
        },
        module: {
            rules: [
                { test: /worker\./i, loader: "worker-loader" },
                { test: /\.tsx?$/, loader: "ts-loader", exclude: [/node_modules/] },
                {
                    test: /\.less$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: "css-loader" },
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions: {
                                    plugins: [require("autoprefixer"), require("cssnano")],
                                },
                            },
                        },
                        {
                            loader: "less-loader",
                            options: { lessOptions: { javascriptEnabled: true } },
                        },
                    ],
                },
                {
                    test: /\.(svg|png|jpe?g|gif|mp4)$/,
                    loader: "url-loader",
                    options: {
                        limit: 2048,
                        name: "[hash:8].[ext]",
                    },
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            // NOTE: keep in sync with tsconfig.json
            alias: {
                "@app": resolve("app/"),
                "@assets": resolve("assets/"),
                "@pipeline": resolve("pipeline/"),
                "@report": resolve("report/"),
            },
        },
        plugins: [
            new HtmlWebpackPlugin({
                chunks: ["app"],
                template: resolve("assets/app.html"),
                filename: "index.html",
                minify: isProd,
            }),
            new HtmlWebpackPlugin({
                chunks: ["report"],
                template: resolve("assets/report.html"),
                filename: "report.html",
                minify: isProd,
            }),
            new MiniCssExtractPlugin(),
            new webpack.DefinePlugin({
                env: {
                    isProd: JSON.stringify(isProd),
                    isDev: JSON.stringify(!isProd),
                },
            }),
        ].concat(
            isProd
                ? [
                      new HTMLInlineCSSWebpackPlugin({ filter: (f) => f.includes("report") }),
                      new InlineChunkHtmlPlugin([/report/]),
                  ]
                : []
        ),
        optimization: {
            minimize: isProd,
        },
        devtool: isProd ? undefined : "source-map",
        devServer: {
            host: "0.0.0.0",
            client: {
                overlay: true,
                progress: true,
            },
            compress: true,
        },
    };
};

// Based on react-dev-utils/InlineChunkHtmlPlugin.js
class InlineChunkHtmlPlugin {
    constructor(tests) {
        this.tests = tests;
    }

    getInlinedTag(publicPath, assets, tag) {
        if (tag.tagName !== "script" || !(tag.attributes && tag.attributes.src)) {
            return tag;
        }
        const scriptName = publicPath ? tag.attributes.src.replace(publicPath, "") : tag.attributes.src;
        if (!this.tests.some((test) => scriptName.match(test))) {
            return tag;
        }
        const asset = assets[scriptName];
        if (asset == null) {
            return tag;
        }
        return { tagName: "script", innerHTML: asset.source(), closeTag: true };
    }

    apply(compiler) {
        let publicPath = compiler.options.output.publicPath || "";
        if (publicPath && !publicPath.endsWith("/")) {
            publicPath += "/";
        }

        compiler.hooks.compilation.tap("InlineChunkHtmlPlugin", (compilation) => {
            const tagFunction = (tag) => this.getInlinedTag(publicPath, compilation.assets, tag);

            const hooks = HtmlWebpackPlugin.getHooks(compilation);
            hooks.alterAssetTagGroups.tap("InlineChunkHtmlPlugin", (assets) => {
                assets.headTags = assets.headTags.map(tagFunction);
                assets.bodyTags = assets.bodyTags.map(tagFunction);
            });
        });
    }
}
