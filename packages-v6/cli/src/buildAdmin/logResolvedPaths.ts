import * as webpack from "webpack";

export class LogResolvedPaths {
    apply(compiler: webpack.Compiler) {
        compiler.hooks.normalModuleFactory.tap("LogResolvedPaths", normalModuleFactory => {
            normalModuleFactory.hooks.afterResolve.tap("LogResolvedPaths", data => {
                // @ts-ignore
                // console.log(data.createData.request);
            });
        });
    }
}
