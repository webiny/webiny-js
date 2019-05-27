module.exports = function findPullRequestId(message) {
    const lines = message.split("\n");
    const firstLine = lines[0];
    const mergeMatch = firstLine.match(/^Merge pull request #(\d+) from /);
    if (mergeMatch) {
        return mergeMatch[1];
    }
    const squashMergeMatch = firstLine.match(/\(#(\d+)\)$/);
    if (squashMergeMatch) {
        return squashMergeMatch[1];
    }
    const homuMatch = firstLine.match(/^Auto merge of #(\d+) - /);
    if (homuMatch) {
        return homuMatch[1];
    }
    return null;
};
