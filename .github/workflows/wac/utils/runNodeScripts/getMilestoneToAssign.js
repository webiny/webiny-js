// Returns the milestone to assign to the PR based on the base branch and the latest Webiny version.
const args = process.argv.slice(2); // Removes the first two elements
const [params] = args;
const { latestWebinyVersion, baseBranch } = JSON.parse(params);

const [major, minor, patch] = latestWebinyVersion.split(".");

switch (baseBranch) {
    case "next":
        // console.log(`${major}.${parseInt(minor, 10) + 1}.0`);
        console.log("6.0.0");
        break;
    case "dev":
        console.log(`${major}.${minor}.${parseInt(patch, 10) + 1}`);
        break;
    default:
        console.log("");
}
