module.exports = {
    ...require("./AfterBuildPlugin"),
    ...require("./AfterDeployPlugin"),
    ...require("./BeforeBuildPlugin"),
    ...require("./BeforeDeployPlugin"),
    ...require("./BeforeWatchPlugin")
};
