import { FunctionName, Plugin } from "@webiny/core";
import webpack from "webpack";
import path from "path";

export type EntryPoints = Map<FunctionName, string>;

interface Params {
  entryPoints: EntryPoints;
  plugins: Plugin[];
  output: string;
  watch: boolean;
}

interface CallbackFunction<T> {
  (err?: null | Error, result?: T): any;
}

export async function bundle({ entryPoints, plugins, output, watch }: Params) {
  // const config = createMultiEntryConfig(Object.fromEntries(entryPoints), plugins, output);

  const config: webpack.Configuration[] = [];

  entryPoints.forEach((entry, name) => {
    config.push(createSingleEntryConfig(name, entry, plugins, output, watch));
  });

  return new Promise<void>((resolve, reject) => {
    const callback: CallbackFunction<webpack.MultiStats> = (err, stats) => {
      try {
        handleStats(err, stats);
      } catch (err) {
        reject(err);
      }

      if (watch) {
        console.log("App rebuilt.\n");
      }

      resolve();
    };

    if (watch) {
      webpack(config).watch({}, callback);
    } else {
      webpack(config).run(callback);
    }
  });
}

function handleStats(err: Error | null | undefined, stats?: webpack.MultiStats) {
  if (stats) {
    console.log(
      stats.toString({
        colors: true,
        assets: true,
        modules: false,
        warnings: false,
        errorDetails: true,
      })
    );
  }

  if (err || (stats && stats.hasErrors())) {
    throw err;
  }
}

function createSingleEntryConfig(
  fnName: FunctionName,
  entry: string,
  plugins: Plugin[],
  output: string,
  watch: boolean
): webpack.Configuration {
  return {
    ...defaults,
    mode: watch ? "development" : "production",
    name: fnName,
    entry: {
      index: entry,
    },
    output: {
      libraryTarget: "commonjs",
      path: path.join(output, "dist", "api", fnName),
      chunkFilename: "[name].chunk.js",
      filename: "[name].js",
      clean: true,
    },
  };
}

function createMultiEntryConfig(
  entries: webpack.EntryObject,
  plugins: Plugin[],
  output: string
): webpack.Configuration {
  return {
    ...defaults,
    entry: entries,
    output: {
      libraryTarget: "commonjs",
      path: path.join(output, "dist", "api"),
      filename: "[name]/index.js",
    },
  };
}

const defaults: Partial<webpack.Configuration> = {
  mode: "production",
  devtool: "inline-source-map",
  externals: [/^aws-sdk/],
  target: "node",
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(js|ts)$/,
        loader: require.resolve("babel-loader"),
        exclude: /node_modules/,
        options: {
          presets: [
            [
              require.resolve("@babel/preset-env"),
              {
                targets: {
                  node: "14",
                },
              },
            ],
            require.resolve("@babel/preset-typescript"),
          ],
          sourceMaps: true,
        },
      },
    ],
  },
  resolve: {
    alias: {
      plugins: path.resolve(process.cwd(), "plugins"),
      webiny: path.resolve(process.cwd(), "webiny"),
    },
    extensions: [".mjs", ".ts", ".json", ".js"],
    fallback: {
      path: require.resolve("path-browserify"),
    },
  },
  stats: "errors-warnings",
  plugins: [],
};
