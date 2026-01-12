export function initTheme() {
    const saved = localStorage.getItem("theme") || "dark";

    if (saved === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
    } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
    }
}
