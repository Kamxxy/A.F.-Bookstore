/* =========================================================
   A.F. BOOKSTORE
   Shared Cart System
========================================================= */


/* =========================================================
   CART CONFIGURATION
========================================================= */

const CART_STORAGE_KEY = "afCart";


/* =========================================================
   CART STATE
========================================================= */

let cart = [];

try {

    const savedCart =
        localStorage.getItem(CART_STORAGE_KEY);

    const parsedCart =
        savedCart
            ? JSON.parse(savedCart)
            : [];

    cart =
        Array.isArray(parsedCart)
            ? parsedCart
            : [];

} catch (error) {

    console.warn(
        "Unable to load saved cart:",
        error
    );

    cart = [];

}


/* =========================================================
   CART ELEMENTS
========================================================= */

const cartBtn =
    document.getElementById("cartBtn");

const cartSidebar =
    document.getElementById("cartSidebar");

const closeCart =
    document.getElementById("closeCart");

const cartItems =
    document.getElementById("cartItems");

const cartCount =
    document.getElementById("cartCount");

const cartTotal =
    document.getElementById("cartTotal");

const overlay =
    document.getElementById("overlay");


/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error(
            "Unable to save cart:",
            error
        );

    }

    renderCart();

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(book, quantity = 1) {

    if (!book) {
        return;
    }


    /* =====================================================
       CHECK STOCK
    ===================================================== */

    const stock =
        Number(book.stockNumber) || 0;


    if (stock <= 0) {

        alert(
            `"${book.title}" is currently out of stock.`
        );

        return;

    }


    /* =====================================================
       NORMALIZE REQUESTED QUANTITY
    ===================================================== */

    quantity =
        Math.max(
            1,
            Number(quantity) || 1
        );


    /* =====================================================
       FIND EXISTING CART ITEM
    ===================================================== */

    const existingBook =
        cart.find(
            item =>
                Number(item.id) ===
                Number(book.id)
        );


    /* =====================================================
       CHECK EXISTING CART QUANTITY
    ===================================================== */

    const currentQuantity =
        existingBook
            ? Number(existingBook.quantity) || 0
            : 0;


    const requestedTotal =
        currentQuantity + quantity;


    if (requestedTotal > stock) {

        alert(
            `Only ${stock} copy${stock === 1 ? "" : "ies"} of "${book.title}" available.`
        );

        return;

    }


    /* =====================================================
       ADD / UPDATE CART
    ===================================================== */

    if (existingBook) {

        existingBook.quantity =
            requestedTotal;

    } else {

        cart.push({

            ...book,

            quantity

        });

    }


    saveCart();

    renderCart();

}


    quantity =
        Math.max(
            1,
            Number(quantity) || 1
        );


    const existingBook =
        cart.find(
            item =>
                Number(item.id) ===
                Number(book.id)
        );


    if (existingBook) {

        existingBook.quantity =
            Number(existingBook.quantity) +
            quantity;

    } else {

        cart.push({

            ...book,

            quantity

        });

    }


    saveCart();

    openCart();




/* =========================================================
   REMOVE FROM CART
========================================================= */

function removeFromCart(id) {

    cart =
        cart.filter(
            item =>
                Number(item.id) !==
                Number(id)
        );

    saveCart();

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeQuantity(id, amount) {

    const book =
        cart.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!book) {
        return;
    }


    book.quantity =
        Number(book.quantity) +
        Number(amount);


    if (book.quantity <= 0) {

        removeFromCart(id);

        return;

    }


    saveCart();

}


/* =========================================================
   GET CART QUANTITY
========================================================= */

function getCartQuantity() {

    return cart.reduce(
        (total, book) => {

            return total +
                Math.max(
                    0,
                    Number(book.quantity) || 0
                );

        },
        0
    );

}


/* =========================================================
   GET CART TOTAL
========================================================= */

function getCartTotal() {

    return cart.reduce(
        (total, book) => {

            const price =
                Number(book.price) || 0;

            const quantity =
                Math.max(
                    0,
                    Number(book.quantity) || 0
                );


            return total +
                price * quantity;

        },
        0
    );

}


/* =========================================================
   FORMAT PRICE FALLBACK
========================================================= */

function safeFormatPrice(value) {

    if (
        typeof formatPrice ===
        "function"
    ) {

        return formatPrice(value);

    }


    return `₦${Number(value || 0).toLocaleString(
        "en-NG"
    )}`;

}


/* =========================================================
   GET BOOK COVER
========================================================= */

function getCartBookCover(book) {

    if (book.cover) {

        return `
            <img
                src="${escapeHtml(book.cover)}"
                alt="${escapeHtml(book.title)}"
                loading="lazy"
            >
        `;

    }


    const background =
        typeof getBookColor === "function"
            ? getBookColor(book.id)
            : "#d7d3c8";


    return `
        <div
            class="cart-cover-placeholder"
            style="
                background:
                ${background};
            "
        >
            ${escapeHtml(book.title)}
        </div>
    `;

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    if (!cartItems) {
        return;
    }


    cartItems.innerHTML = "";


    /* =====================================================
       EMPTY CART
    ===================================================== */

    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <span>◌</span>

                <p>
                    Your bag is empty.
                </p>

            </div>

        `;

    }


    /* =====================================================
       CART ITEMS
    ===================================================== */

    else {

        cart.forEach(book => {

            const item =
                document.createElement("article");


            item.className =
                "cart-item";


            const price =
                Number(book.price) || 0;


            const quantity =
                Math.max(
                    1,
                    Number(book.quantity) || 1
                );


            const itemTotal =
                price * quantity;


            item.innerHTML = `

                <div
                    class="cart-item-cover"
                    style="
                        background:
                        ${
                            typeof getBookColor === "function"
                                ? getBookColor(book.id)
                                : "#d7d3c8"
                        };
                    "
                >

                    ${getCartBookCover(book)}

                </div>


                <div class="cart-item-info">

                    <h3>
                        ${escapeHtml(book.title)}
                    </h3>


                    <p>
                        ${escapeHtml(book.author || "")}
                    </p>


                    <strong>
                        ${safeFormatPrice(itemTotal)}
                    </strong>


                    <div class="cart-item-controls">

                        <button
                            type="button"
                            class="cart-quantity-btn"
                            data-action="decrease"
                            data-id="${escapeHtml(book.id)}"
                            aria-label="Decrease quantity of ${escapeHtml(book.title)}"
                        >
                            −
                        </button>


                        <span
                            aria-label="Quantity"
                        >
                            ${quantity}
                        </span>


                        <button
                            type="button"
                            class="cart-quantity-btn"
                            data-action="increase"
                            data-id="${escapeHtml(book.id)}"
                            aria-label="Increase quantity of ${escapeHtml(book.title)}"
                        >
                            +
                        </button>


                        <button
                            type="button"
                            class="remove-cart-item"
                            data-action="remove"
                            data-id="${escapeHtml(book.id)}"
                            aria-label="Remove ${escapeHtml(book.title)} from cart"
                        >
                            REMOVE
                        </button>

                    </div>

                </div>

            `;


            cartItems.appendChild(item);

        });

    }


    /* =====================================================
       UPDATE CART COUNT
    ===================================================== */

    if (cartCount) {

        const quantity =
            getCartQuantity();


        cartCount.textContent =
            quantity;


        cartCount.setAttribute(
            "aria-label",
            `${quantity} ${
                quantity === 1
                    ? "item"
                    : "items"
            } in cart`
        );

    }


    /* =====================================================
       UPDATE CART TOTAL
    ===================================================== */

    if (cartTotal) {

        cartTotal.textContent =
            safeFormatPrice(
                getCartTotal()
            );

    }


    /* =====================================================
       UPDATE CART BUTTON
    ===================================================== */

    if (cartBtn) {

        const quantity =
            getCartQuantity();


        cartBtn.setAttribute(
            "aria-label",
            `Shopping cart, ${
                quantity
            } ${
                quantity === 1
                    ? "item"
                    : "items"
            }`
        );

    }

}


/* =========================================================
   UPDATE CART
   Compatibility function for other scripts
========================================================= */

function updateCart() {

    renderCart();

}


/* =========================================================
   CART ITEM EVENTS
   Event delegation
========================================================= */

if (cartItems) {

    cartItems.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {
                return;
            }


            const id =
                button.dataset.id;

            const action =
                button.dataset.action;


            if (!id) {
                return;
            }


            /* ============================
               INCREASE
            ============================ */

            if (action === "increase") {

                function changeQuantity(id, amount) {

    const book =
        cart.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!book) {
        return;
    }


    const currentQuantity =
        Number(book.quantity) || 0;


    const stock =
        Number(book.stockNumber) || 0;


    const newQuantity =
        currentQuantity +
        Number(amount);


    /* =====================================================
       PREVENT QUANTITY FROM EXCEEDING STOCK
    ===================================================== */

    if (newQuantity > stock) {

        alert(
            `Only ${stock} copy${stock === 1 ? "" : "ies"} of "${book.title}" available.`
        );

        return;

    }


    /* =====================================================
       REMOVE WHEN QUANTITY REACHES ZERO
    ===================================================== */

    if (newQuantity <= 0) {

        removeFromCart(id);

        return;

    }


    book.quantity =
        newQuantity;


    saveCart();

    renderCart();

}

                return;

            }


            /* ============================
               DECREASE
            ============================ */

            if (action === "decrease") {

                changeQuantity(
                    id,
                    -1
                );

                return;

            }


            /* ============================
               REMOVE
            ============================ */

            if (action === "remove") {

                removeFromCart(id);

            }

        }
    );

}


/* =========================================================
   OPEN CART
========================================================= */

function openCart() {

    if (cartSidebar) {

        cartSidebar.classList.add(
            "active"
        );

        cartSidebar.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "active"
        );

    }


    document.body.classList.add(
        "cart-open"
    );

}


/* =========================================================
   CLOSE CART
========================================================= */

function closeCartSidebar() {

    if (cartSidebar) {

        cartSidebar.classList.remove(
            "active"
        );

        cartSidebar.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    document.body.classList.remove(
        "cart-open"
    );

}


/* =========================================================
   CART BUTTON
========================================================= */

if (cartBtn) {

    cartBtn.addEventListener(
        "click",
        openCart
    );

}


/* =========================================================
   CLOSE BUTTON
========================================================= */

if (closeCart) {

    closeCart.addEventListener(
        "click",
        closeCartSidebar
    );

}


/* =========================================================
   OVERLAY
========================================================= */

if (overlay) {

    overlay.addEventListener(
        "click",
        closeCartSidebar
    );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            cartSidebar &&
            cartSidebar.classList.contains("active")
        ) {

            closeCartSidebar();

        }

    }
);


/* =========================================================
   PREVENT BACKGROUND SCROLLING
========================================================= */

const cartOpenStyle =
    document.createElement("style");

cartOpenStyle.textContent = `

    body.cart-open {
        overflow: hidden;
    }

`;

document.head.appendChild(
    cartOpenStyle
);


/* =========================================================
   STORAGE SYNC
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key !==
            CART_STORAGE_KEY
        ) {

            return;

        }


        try {

            const updatedCart =
                event.newValue
                    ? JSON.parse(
                        event.newValue
                    )
                    : [];


            cart =
                Array.isArray(updatedCart)
                    ? updatedCart
                    : [];


            renderCart();

        } catch (error) {

            console.warn(
                "Unable to sync cart:",
                error
            );

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

renderCart();