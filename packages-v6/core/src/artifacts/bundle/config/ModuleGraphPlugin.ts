import webpack from "webpack";

export class ModuleGraphPlugin {
    apply(compiler: webpack.Compiler) {
        const className = this.constructor.name;
        const skip = [".artifacts", "node_modules", "data:"];
        compiler.hooks.compilation.tap(className, compilation => {
            compilation.hooks.finishModules.tap(className, modules => {
                const normalModules = modules as Iterable<webpack.NormalModule>;
                const toWatch = Array.from(normalModules).filter(m => {
                    return m.resource && !skip.some(part => m.resource.includes(part));
                });

                console.log(toWatch.map(m => m.resource));
            });
        });
    }
}
