import execa from "execa";

export const runYarnInstall = async (cwd?: string) => {
    await execa("yarn", ["install"], { cwd });
};
