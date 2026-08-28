/* =========================================================
   A.F. BOOKSTORE
   ADMIN JAVASCRIPT
========================================================= */
if (!requireAdminAuth()) {
    window.location.href = "/admin/login";
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

        const response2 =
            await fetch("/api/orders");
        
        
        if (!response2.ok) {
    
            throw new Error(
                `Failed to load books: ${response2.status}`
            );
    
        }


        const books =
            await response.json();


        const totalBooks =
            books.length;

        const orders = 
            await response2.json();

        const totalOrders = 
            orders.length;


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
            "totalOrders"
        ).textContent = totalOrders;


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

document.addEventListener(
    "DOMContentLoaded",
    loadBookStats
);