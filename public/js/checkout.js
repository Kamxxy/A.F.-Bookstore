/* =========================================================
   A.F. BOOKSTORE
   CHECKOUT JAVASCRIPT
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const CART_STORAGE_KEY = "afCart";

const API_BASE_URL = "http://localhost:8000";

const ORDERS_API_URL =
    `${API_BASE_URL}/api/orders`;


/*
    Temporary delivery fee.

    The backend should remain the final authority
    for the actual delivery fee and total.
*/

const DELIVERY_FEE = 2000;


/* =========================================================
   LOAD CART
========================================================= */

let cart = [];

try {

    const savedCart =
        localStorage.getItem(
            CART_STORAGE_KEY
        );

    const parsedCart =
        savedCart
            ? JSON.parse(savedCart)
            : [];

    cart =
        Array.isArray(parsedCart)
            ? parsedCart
            : [];

} catch (error) {

    console.error(
        "Unable to load cart:",
        error
    );

    cart = [];

}


/* =========================================================
   ELEMENTS
========================================================= */

const summaryItems =
    document.getElementById(
        "summaryItems"
    );


const summaryCount =
    document.getElementById(
        "summaryCount"
    );


const summarySubtotal =
    document.getElementById(
        "summarySubtotal"
    );


const summaryDelivery =
    document.getElementById(
        "summaryDelivery"
    );


const summaryTotal =
    document.getElementById(
        "summaryTotal"
    );


const checkoutForm =
    document.getElementById(
        "checkoutForm"
    );


const emptyCheckout =
    document.getElementById(
        "emptyCheckout"
    );


const placeOrderBtn =
    document.getElementById(
        "placeOrderBtn"
    );


/* =========================================================
   FORMAT PRICE
========================================================= */

function formatPrice(value) {

    return `₦${Number(
        value || 0
    ).toLocaleString("en-NG")}`;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   GET CART QUANTITY
========================================================= */

function getCartQuantity() {

    return cart.reduce(
        (
            total,
            book
        ) => {

            return total +
                Math.max(
                    0,
                    Number(
                        book.quantity
                    ) || 0
                );

        },
        0
    );

}


/* =========================================================
   GET SUBTOTAL
========================================================= */

function getSubtotal() {

    return cart.reduce(
        (
            total,
            book
        ) => {

            const price =
                Number(
                    book.price
                ) || 0;


            const quantity =
                Math.max(
                    0,
                    Number(
                        book.quantity
                    ) || 0
                );


            return total +
                (
                    price *
                    quantity
                );

        },
        0
    );

}


/* =========================================================
   GET BOOK COVER
========================================================= */

function getBookCover(book) {

    if (book.cover) {

        return `
            <img
                src="${escapeHtml(book.cover)}"
                alt="${escapeHtml(book.title)}"
            >
        `;

    }


    return `
        <span>
            ${escapeHtml(book.title)}
        </span>
    `;

}


/* =========================================================
   RENDER ORDER SUMMARY
========================================================= */

function renderSummary() {

    if (!summaryItems) {
        return;
    }


    /*
        EMPTY CART
    */

    if (cart.length === 0) {

        emptyCheckout.hidden =
            false;

        summaryItems.innerHTML =
            "";

        if (summaryCount) {
            summaryCount.textContent =
                "0 items";
        }

        if (summarySubtotal) {
            summarySubtotal.textContent =
                formatPrice(0);
        }

        if (summaryDelivery) {
            summaryDelivery.textContent =
                "—";
        }

        if (summaryTotal) {
            summaryTotal.textContent =
                formatPrice(0);
        }

        return;

    }


    emptyCheckout.hidden =
        true;


    summaryItems.innerHTML =
        "";


    /*
        RENDER ITEMS
    */

    cart.forEach(
        book => {

            const price =
                Number(
                    book.price
                ) || 0;


            const quantity =
                Math.max(
                    1,
                    Number(
                        book.quantity
                    ) || 1
                );


            const itemTotal =
                price *
                quantity;


            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "summary-item";


            item.innerHTML = `

                <div
                    class="summary-cover"
                >
                    ${getBookCover(book)}
                </div>


                <div
                    class="summary-info"
                >

                    <h3>
                        ${escapeHtml(
                            book.title
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            book.author || ""
                        )}
                    </p>

                    <small>
                        QTY: ${quantity}
                    </small>

                </div>


                <strong
                    class="summary-item-price"
                >
                    ${formatPrice(
                        itemTotal
                    )}
                </strong>

            `;


            summaryItems.appendChild(
                item
            );

        }
    );


    /*
        TOTALS
    */

    const quantity =
        getCartQuantity();


    const subtotal =
        getSubtotal();


    const total =
        subtotal +
        DELIVERY_FEE;


    summaryCount.textContent =
        `${quantity} ${
            quantity === 1
                ? "item"
                : "items"
        }`;


    summarySubtotal.textContent =
        formatPrice(
            subtotal
        );


    summaryDelivery.textContent =
        formatPrice(
            DELIVERY_FEE
        );


    summaryTotal.textContent =
        formatPrice(
            total
        );

}


/* =========================================================
   VALIDATION HELPERS
========================================================= */

function setError(
    fieldId,
    message
) {

    const errorElement =
        document.getElementById(
            `${fieldId}Error`
        );


    if (errorElement) {

        errorElement.textContent =
            message;

    }

}


function clearErrors() {

    document
        .querySelectorAll(
            ".form-error"
        )
        .forEach(
            element => {

                element.textContent =
                    "";

            }
        );

}


/* =========================================================
   VALIDATE FORM
========================================================= */

function validateForm() {

    clearErrors();


    let valid = true;


    const fullName =
        document.getElementById(
            "fullName"
        );


    const email =
        document.getElementById(
            "email"
        );


    const phone =
        document.getElementById(
            "phone"
        );


    const address =
        document.getElementById(
            "address"
        );


    const city =
        document.getElementById(
            "city"
        );


    const state =
        document.getElementById(
            "state"
        );


    /*
        NAME
    */

    if (
        fullName.value.trim().length <
        2
    ) {

        setError(
            "fullName",
            "Please enter your full name."
        );

        valid = false;

    }


    /*
        EMAIL
    */

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            email.value.trim()
        )
    ) {

        setError(
            "email",
            "Please enter a valid email address."
        );

        valid = false;

    }


    /*
        PHONE
    */

    const phonePattern =
        /^[0-9+\-\s()]{7,20}$/;


    if (
        !phonePattern.test(
            phone.value.trim()
        )
    ) {

        setError(
            "phone",
            "Please enter a valid phone number."
        );

        valid = false;

    }


    /*
        ADDRESS
    */

    if (
        address.value.trim().length <
        5
    ) {

        setError(
            "address",
            "Please enter your delivery address."
        );

        valid = false;

    }


    /*
        CITY
    */

    if (
        city.value.trim().length <
        2
    ) {

        setError(
            "city",
            "Please enter your city."
        );

        valid = false;

    }


    /*
        STATE
    */

    if (
        state.value.trim().length <
        2
    ) {

        setError(
            "state",
            "Please enter your state."
        );

        valid = false;

    }


    return valid;

}


/* =========================================================
   CREATE ORDER DATA
========================================================= */

function createOrderPayload() {

    const fullName =
        document.getElementById(
            "fullName"
        ).value.trim();


    const email =
        document.getElementById(
            "email"
        ).value.trim();


    const phone =
        document.getElementById(
            "phone"
        ).value.trim();


    const address =
        document.getElementById(
            "address"
        ).value.trim();


    const city =
        document.getElementById(
            "city"
        ).value.trim();


    const state =
        document.getElementById(
            "state"
        ).value.trim();


    return {

        customer: {

            name: fullName,

            email: email,

            phone: phone

        },


        delivery: {

            address: address,

            city: city,

            state: state

        },


        /*
            Only send the book ID and quantity
            as authoritative order inputs.

            The backend looks up the current
            book price and details itself.
        */

        items: cart.map(
            book => ({

                bookId:
                    book.id,

                quantity:
                    Math.max(
                        1,
                        Number(
                            book.quantity
                        ) || 1
                    )

            })
        )

    };

}


/* =========================================================
   SET SUBMITTING STATE
========================================================= */

function setSubmitting(
    submitting
) {

    if (!placeOrderBtn) {
        return;
    }


    placeOrderBtn.disabled =
        submitting;


    if (submitting) {

        placeOrderBtn.innerHTML = `

            <span>
                Processing Order...
            </span>

            <span>
                ⏳
            </span>

        `;

    } else {

        placeOrderBtn.innerHTML = `

            <span>
                Place Order
            </span>

            <span>
                →
            </span>

        `;

    }

}


/* =========================================================
   SHOW API ERROR
========================================================= */

function showApiError(
    message
) {

    /*
        Use the form's existing note area
        if available.
    */

    const checkoutNote =
        document.querySelector(
            ".checkout-note"
        );


    if (checkoutNote) {

        checkoutNote.textContent =
            message;

        checkoutNote.style.color =
            "#a87373";

        return;

    }


    alert(message);

}


/* =========================================================
   SUBMIT ORDER TO API
========================================================= */

async function submitOrder(
    order
) {

    const response =
        await fetch(
            ORDERS_API_URL,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        order
                    )

            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    /*
        Handle HTTP errors.
    */

    if (!response.ok) {

        throw new Error(

            data?.message ||
            "Unable to create your order. Please try again."

        );

    }


    /*
        Make sure the API returned
        the expected success response.
    */

    if (
        !data ||
        data.success !== true ||
        !data.order
    ) {

        throw new Error(
            "The server returned an unexpected response."
        );

    }


    return data;

}


/* =========================================================
   FORM SUBMISSION
========================================================= */

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /*
                Don't submit an empty cart.
            */

            if (
                cart.length === 0
            ) {

                emptyCheckout.hidden =
                    false;

                return;

            }


            /*
                Prevent duplicate submissions.
            */

            if (
                placeOrderBtn &&
                placeOrderBtn.disabled
            ) {

                return;

            }


            /*
                Validate customer details.
            */

            if (
                !validateForm()
            ) {

                return;

            }


            /*
                Build order payload.
            */

            const order =
                createOrderPayload();


            /*
                Start loading state.
            */

            setSubmitting(true);


            try {

                console.log(
                    "Submitting order:",
                    order
                );


                /*
                    Send order to backend.
                */

                const result =
                    await submitOrder(
                        order
                    );


                const createdOrder =
                    result.order;


                /*
                    Store the order ID.

                    This will be useful when we
                    build the payment flow later.
                */

                if (
                    createdOrder.id
                ) {

                    sessionStorage.setItem(
                        "afLastOrderId",
                        createdOrder.id
                    );

                }


                /*
                    Clear cart ONLY after the
                    backend successfully created
                    the order.
                */

                cart = [];


                localStorage.removeItem(
                    CART_STORAGE_KEY
                );


                renderSummary();


                /*
                    Temporary success message.

                    Later this will become a proper
                    order confirmation/payment flow.
                */

                const checkoutNote =
                    document.querySelector(
                        ".checkout-note"
                    );


                if (checkoutNote) {

                    checkoutNote.textContent =
                        `Order created successfully. Order ID: ${createdOrder.id}`;

                    checkoutNote.style.color =
                        "var(--checkout-muted)";

                }


                alert(
                    `Order created successfully!\n\nOrder ID: ${createdOrder.id}`
                );


                console.log(
                    "Created order:",
                    createdOrder
                );

            }

            catch (error) {

                console.error(
                    "Order submission error:",
                    error
                );


                showApiError(
                    error.message ||
                    "Unable to create your order. Please try again."
                );

            }

            finally {

                setSubmitting(
                    false
                );

            }

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

renderSummary();