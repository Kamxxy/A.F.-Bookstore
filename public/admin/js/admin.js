/* =========================================================
   A.F. BOOKSTORE
   ADMIN JAVASCRIPT
========================================================= */
if (!requireAdminAuth()) {
    window.location.href = "/admin/login";
}

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const menuButton =
    document.querySelector(
        ".admin-menu-btn"
    );


const sidebar =
    document.querySelector(
        ".admin-sidebar"
    );


if (menuButton && sidebar) {

    menuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


/* =========================================================
   BOOK INVENTORY
========================================================= */

async function loadBookStats() {

    try {

        const response =
            await fetch("/api/books");


        if (!response.ok) {

            throw new Error(
                `Failed to load books: ${response.status}`
            );

        }


        const books =
            await response.json();


        const totalBooks =
            books.length;


        const outOfStock =
            books.filter(
                book =>
                    String(
                        book.stockStatus || ""
                    ).toLowerCase() === "out of stock"
            ).length;


        const inStock =
            books.filter(
                book =>
                    String(
                        book.stockStatus || ""
                    ).toLowerCase() === "in stock"
            ).length;


        const lowStock =
            books.filter(
                book => {

                    const stock =
                        Number(
                            book.stockNumber || 0
                        );

                    return (
                        stock > 0 &&
                        stock <= 5
                    );

                }
            ).length;


        document.getElementById(
            "totalBooks"
        ).textContent = totalBooks;


        document.getElementById(
            "lowStock"
        ).textContent = lowStock;


        document.getElementById(
            "outOfStock"
        ).textContent = outOfStock;


        document.getElementById(
            "inStock"
        ).textContent = inStock;


        document.getElementById(
            "inventoryLowStock"
        ).textContent = lowStock;


        document.getElementById(
            "inventoryOutOfStock"
        ).textContent = outOfStock;


    } catch (error) {

        console.error(
            "Admin book statistics error:",
            error
        );

    }

}

function logoutAdmin() {

    localStorage.removeItem("adminToken");

    window.location.href = "/admin/login";

}


document.addEventListener(
    "DOMContentLoaded",
    loadBookStats
);