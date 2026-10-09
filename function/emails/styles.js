/* =========================================================
   EMAIL STYLES
   Brand constants and reusable inline-style snippets.
   Email clients ignore <style> blocks inconsistently,
   so every style below is applied inline at render time.
========================================================= */

const BRAND = {
    name: "A.F. Bookstore",
    tagline: "Stories worth keeping.",
    ink: "#1f1b16",
    muted: "#6b6259",
    accent: "#8a6d3b",
    background: "#f5f1e8",
    card: "#ffffff",
    border: "#e5ddcc",
    buttonText: "#ffffff"
};

const FONT_STACK =
    "Georgia, 'Times New Roman', serif";

const SANS_STACK =
    "Helvetica, Arial, sans-serif";


module.exports = {
    BRAND,
    FONT_STACK,
    SANS_STACK
};
