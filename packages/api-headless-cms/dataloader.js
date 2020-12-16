const DataLoader = require("dataloader");

(async () => {
    const loader = new DataLoader(keys => {
        return new Promise(resolve => {
            console.log("Loading data...", keys);
            setTimeout(() => {
                resolve([[1, 2, 3]]);
            }, 1000);
        });
    });

    console.log(await loader.load("listModels"));
    console.log(await loader.load("listModels"));
    console.log(await loader.load("listModels"));
    console.log(await loader.load("listModels"));
    console.log(await loader.load("listModels"));
    console.log(await loader.load("listModels"));
    console.log(await loader.load("listModels"));
})();
