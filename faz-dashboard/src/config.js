const host = window.location.hostname;
const isLocal = host === "localhost" || host === "127.0.0.1";

const getBackendURL = () => {
    if (isLocal) return "http://127.0.0.1:3320";
    if (host === "sentinel.itcold.com") return "https://sentinel.itcold.com";
    return `http://${host}:3320`;
};

export const backendURL = getBackendURL();
