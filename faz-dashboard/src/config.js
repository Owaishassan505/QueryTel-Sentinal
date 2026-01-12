const isProd = window.location.hostname === "sentinel.itcold.com";

export const backendURL = isProd
    ? "https://sentinel.itcold.com"
    : "http://127.0.0.1:3320";
