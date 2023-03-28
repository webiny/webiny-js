/**
 * Get duration since the given ISO timestamp.
 * @param string since
 */
export const getDuration = (since: string) => {
    const ms = new Date().getTime() - new Date(since).getTime();
    let seconds = Math.floor(ms / 1000);
    let minutes = undefined;
    if (seconds > 60) {
        minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
    }

    return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
};
