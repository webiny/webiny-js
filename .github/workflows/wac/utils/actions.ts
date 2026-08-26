// Third-party GitHub Actions, pinned to commit SHAs rather than tags.
//
// A tag is mutable: whoever controls the action's repository can repoint `v5` at new code, and
// every workflow in this repo would run it on the next push - with our secrets and a writable
// token. Pinning to a SHA means an action's code can only change when someone changes it here,
// in a reviewable diff.
//
// Keep the version in the trailing comment up to date when bumping. Generated YAML cannot carry
// comments, so this file is the only place the human-readable version is recorded.
//
// To bump one: `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`
export const ACTION = {
    // actions/checkout v5
    checkout: "actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09",
    // actions/setup-node v5
    setupNode: "actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444",
    // actions/cache v5
    cache: "actions/cache@caa296126883cff596d87d8935842f9db880ef25",
    // actions/upload-artifact v6
    uploadArtifactV6: "actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f",
    // actions/upload-artifact v7
    uploadArtifact: "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
    // actions/download-artifact v8
    downloadArtifact: "actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
    // aws-actions/configure-aws-credentials v6.0.0
    configureAwsCredentials:
        "aws-actions/configure-aws-credentials@8df5847569e6427dd6c4fb1cf565c83acfa8afa7",
    // peter-evans/create-or-update-comment v5
    createOrUpdateComment:
        "peter-evans/create-or-update-comment@e8674b075228eee787fea43ef493e45ece1004c9",
    // dorny/paths-filter v4
    pathsFilter: "dorny/paths-filter@ceb8a2b8f2d89434be7ff52d3de7ec3738c5cc9d"
} as const;
