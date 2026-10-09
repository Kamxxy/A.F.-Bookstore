/**
 * Book stock-status regression tests (no database required).
 * Verifies the availability label is always present and derived
 * from the stored stock count, in both Mongo-shaped records
 * (no stockStatus field) and JSON records.
 * Run: node function/scripts/book-stock-status-test.js
 */

const {
    resolveStockStatus,
    getBookById,
    getAllBooks
} = require("../services/bookService");

let failures = 0;

function check(name, condition) {
    if (condition) {
        console.log(`PASS: ${name}`);
    } else {
        console.log(`FAIL: ${name}`);
        failures++;
    }
}

function validLabel(value) {
    return typeof value === "string" &&
        value.trim() !== "" &&
        value !== "undefined" &&
        value !== "null";
}

/* ---------- rule: Mongo-shaped records (field absent) ---------- */

check(
    "positive stock without field resolves In Stock",
    resolveStockStatus({ id: 1, stockNumber: 10 }).stockStatus === "In Stock"
);

check(
    "zero stock without field resolves Out of Stock",
    resolveStockStatus({ id: 2, stockNumber: 0 }).stockStatus === "Out of Stock"
);

check(
    "missing stockNumber resolves Out of Stock without inventing stock",
    (() => {
        const out = resolveStockStatus({ id: 3 });
        return out.stockStatus === "Out of Stock" && out.stockNumber === undefined;
    })()
);

/* ---------- rule: stored values are preserved, never overwritten ---------- */

check(
    "stored In Stock is preserved",
    resolveStockStatus({ id: 4, stockNumber: 5, stockStatus: "In Stock" }).stockStatus === "In Stock"
);

check(
    "stored Out of Stock is preserved",
    resolveStockStatus({ id: 5, stockNumber: 0, stockStatus: "Out of Stock" }).stockStatus === "Out of Stock"
);

check(
    "empty string is treated as missing and derived",
    resolveStockStatus({ id: 6, stockNumber: 4, stockStatus: "   " }).stockStatus === "In Stock"
);

check(
    "null is treated as missing and derived",
    resolveStockStatus({ id: 7, stockNumber: 0, stockStatus: null }).stockStatus === "Out of Stock"
);

/* ---------- rule: non-records pass through untouched ---------- */

check(
    "null and undefined pass through for 404 handling",
    resolveStockStatus(null) === null && resolveStockStatus(undefined) === undefined
);

/* ---------- integration: JSON-mode read paths ---------- */

async function integration() {
    const books = await getAllBooks();

    check(
        "getAllBooks returns records",
        Array.isArray(books) && books.length > 0
    );

    const allValid = books.every(book => validLabel(book.stockStatus));
    check("every book carries a valid availability label", allValid);

    const rendered = books.map(book => `${book.stockStatus}`);
    check(
        "no rendered label is ever undefined/null",
        rendered.every(text => text !== "undefined" && text !== "null" && text.trim() !== "")
    );

    const outOfStock = books.filter(book => Number(book.stockNumber) <= 0);
    check(
        "out-of-stock books report Out of Stock",
        outOfStock.length > 0 &&
        outOfStock.every(book => book.stockStatus === "Out of Stock")
    );

    const inStock = books.filter(book => Number(book.stockNumber) > 0);
    check(
        "in-stock books report In Stock",
        inStock.length > 0 &&
        inStock.every(book => book.stockStatus === "In Stock")
    );

    const one = await getBookById(books[0].id);
    check(
        "getBookById returns a valid availability label",
        !!one && validLabel(one.stockStatus)
    );

    const missing = await getBookById(999999);
    check("getBookById still returns falsy for unknown ids", !missing);
}

(async () => {
    await integration();
    console.log(failures === 0 ? "\nAll stock-status tests passed." : `\n${failures} check(s) failed.`);
    process.exit(failures === 0 ? 0 : 1);
})().catch((error) => {
    console.error("Test harness error:", error && error.message);
    process.exit(1);
});
