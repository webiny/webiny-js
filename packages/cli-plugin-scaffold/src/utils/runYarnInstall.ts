import execa from "execa";

const runYarnInstall = async (cwd?: string) => {
    await execa("yarn", ["install"], { cwd });
}

export default runYarnInstall;
