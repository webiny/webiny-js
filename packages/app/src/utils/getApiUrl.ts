export const getApiUrl = (path = ""): string => {
    return process.env.REACT_APP_API_URL + path;
};
