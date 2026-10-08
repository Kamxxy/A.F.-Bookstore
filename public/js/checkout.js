/* =========================================================
   A.F. BOOKSTORE
   CHECKOUT JAVASCRIPT
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const CART_STORAGE_KEY = "afCart";

const API_BASE_URL = "";

const ORDERS_API_URL =
    `${API_BASE_URL}/api/orders`;


const PAYMENTS_API_URL =
    `${API_BASE_URL}/api/payments/initialize`;


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


    const state =
        document.getElementById(
            "state"
        );


    const lga =
        document.getElementById(
            "lga"
        );


    const area =
        document.getElementById(
            "area"
        );


    const street =
        document.getElementById(
            "street"
        );


    const houseNumber =
        document.getElementById(
            "houseNumber"
        );


    const details =
        document.getElementById(
            "details"
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
        STATE
    */

    if (!state.value) {

        setError(
            "state",
            "Please select your state."
        );

        valid = false;

    }


    /*
        LGA
    */

    if (!lga.value) {

        setError(
            "lga",
            "Please select your LGA."
        );

        valid = false;

    }


    /*
        AREA
    */

    if (
        area.value.trim().length <
        2
    ) {

        setError(
            "area",
            "Please enter your area / district."
        );

        valid = false;

    }


    /*
        STREET
    */

    if (
        street.value.trim().length <
        2
    ) {

        setError(
            "street",
            "Please enter your street / road."
        );

        valid = false;

    }


    /*
        HOUSE NUMBER (optional — validated only when given)
    */

    if (
        houseNumber.value.trim().length > 0 &&
        houseNumber.value.trim().length >
        100
    ) {

        setError(
            "houseNumber",
            "House number is too long."
        );

        valid = false;

    }


    return valid;

}


/* =========================================================
   CREATE ORDER DATA
========================================================= */


/* =========================================================
   LIVE FORM VALIDATION
========================================================= */

const checkoutFields = [

    document.getElementById("fullName"),

    document.getElementById("email"),

    document.getElementById("phone"),

    document.getElementById("state"),

    document.getElementById("lga"),

    document.getElementById("area"),

    document.getElementById("street")

].filter(Boolean);


/* =========================================================
   NIGERIAN STATE / LGA DROPDOWNS

   Data is served locally from the bundled dataset via
   GET /api/divisions. No external API or key required.
   Source: open-admin-data/nigeria-administrative-divisions
   License: CC-BY-4.0
   ========================================================= */

let nigeriaStates = [];


async function loadDivisions() {

    const stateSelect =
        document.getElementById("state");

    const lgaSelect =
        document.getElementById("lga");

    if (!stateSelect || !lgaSelect) {
        return;
    }

    try {

        const response =
            await fetch("/api/divisions");

        const data =
            await response.json();

        if (!data || !Array.isArray(data.states)) {
            throw new Error("Invalid divisions data");
        }

        nigeriaStates = data.states;

        stateSelect.innerHTML =
            '<option value="">Select state</option>' +
            nigeriaStates
                .map(
                    (state) =>
                        `<option value="${state.name}">${state.name}</option>`
                )
                .join("");

    } catch (error) {

        console.error(
            "Failed to load Nigerian states:",
            error
        );

    }

}


function populateLgas(stateName) {

    const lgaSelect =
        document.getElementById("lga");

    if (!lgaSelect) {
        return;
    }

    const state =
        nigeriaStates.find(
            (entry) => entry.name === stateName
        );

    lgaSelect.innerHTML =
        '<option value="">Select LGA</option>';

    if (state && Array.isArray(state.lgas)) {

        lgaSelect.innerHTML +=
            state.lgas
                .map(
                    (lga) =>
                        `<option value="${lga}">${lga}</option>`
                )
                .join("");

        lgaSelect.disabled = false;

    } else {

        lgaSelect.disabled = true;

    }

}


const stateSelectEl =
    document.getElementById("state");

if (stateSelectEl) {

    stateSelectEl.addEventListener(
        "change",
        (event) => {
            populateLgas(event.target.value);
        }
    );

}


loadDivisions();


/* =========================================================
   VALIDATE FIELD WHILE TYPING
   ========================================================= */


/* =========================================================
   VALIDATE FIELD WHILE TYPING
========================================================= */

checkoutFields.forEach(field => {

    /*
        Validate after the customer leaves
        the field for the first time.
    */

    field.addEventListener(
        "blur",
        () => {

            validateSingleField(field);

        }
    );


    /*
        Once a field has been marked invalid,
        validate it again while typing.
    */

    field.addEventListener(
        "input",
        () => {

            if (
                field.classList.contains(
                    "field-invalid"
                )
            ) {

                validateSingleField(field);

            }

        }
    );

});


/* =========================================================
   VALIDATE SINGLE FIELD
========================================================= */

function validateSingleField(field) {

    const value =
        field.value.trim();


    /*
        Clear previous state.
    */

    field.classList.remove(
        "field-invalid",
        "field-valid"
    );


    field.removeAttribute(
        "aria-invalid"
    );


    const errorElement =
        document.getElementById(
            `${field.id}Error`
        );


    if (errorElement) {

        errorElement.textContent =
            "";

    }


    /*
        REQUIRED
    */

    if (!value) {

        markFieldInvalid(
            field,
            "This field is required."
        );

        return false;

    }


    /*
        FULL NAME
    */

    if (
        field.id === "fullName" &&
        value.length < 2
    ) {

        markFieldInvalid(
            field,
            "Please enter your full name."
        );

        return false;

    }


    /*
        EMAIL
    */

    if (
        field.id === "email"
    ) {

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !emailPattern.test(value)
        ) {

            markFieldInvalid(
                field,
                "Please enter a valid email address."
            );

            return false;

        }

    }


    /*
        NIGERIAN PHONE NUMBER
    */

    if (
        field.id === "phone"
    ) {

        const cleanedPhone =
            value.replace(
                /[\s()-]/g,
                ""
            );


        const phonePattern =
            /^(?:\+234|0)(?:7|8|9)[0-9]{9}$/;


        if (
            !phonePattern.test(
                cleanedPhone
            )
        ) {

            markFieldInvalid(
                field,
                "Please enter a valid Nigerian phone number."
            );

            return false;

        }

    }


    /*
        STATE / LGA
    */

    if (
        (
            field.id === "state" ||
            field.id === "lga"
        ) &&
        !value
    ) {

        markFieldInvalid(
            field,
            "Please make a selection."
        );

        return false;

    }


    /*
        AREA / STREET
    */

    if (
        (
            field.id === "area" ||
            field.id === "street"
        ) &&
        value.length < 2
    ) {

        markFieldInvalid(
            field,
            "Please enter a valid value."
        );

        return false;

    }


    /*
        HOUSE NUMBER — optional field.
        Kept out of live required validation so an empty
        value is always allowed.
    */


    /*
        EVERYTHING PASSED
    */

    markFieldValid(field);

    return true;

}


/* =========================================================
   INVALID FIELD
========================================================= */

function markFieldInvalid(
    field,
    message
) {

    field.classList.add(
        "field-invalid"
    );


    field.setAttribute(
        "aria-invalid",
        "true"
    );


    const errorElement =
        document.getElementById(
            `${field.id}Error`
        );


    if (errorElement) {

        errorElement.textContent =
            message;

    }

}


/* =========================================================
   VALID FIELD
========================================================= */

function markFieldValid(field) {

    field.classList.add(
        "field-valid"
    );


    field.setAttribute(
        "aria-invalid",
        "false"
    );


    const errorElement =
        document.getElementById(
            `${field.id}Error`
        );


    if (errorElement) {

        errorElement.textContent =
            "✓ Looks good.";

    }

}

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


    const state =
        document.getElementById(
            "state"
        ).value.trim();


    const lga =
        document.getElementById(
            "lga"
        ).value.trim();


    const area =
        document.getElementById(
            "area"
        ).value.trim();


    const street =
        document.getElementById(
            "street"
        ).value.trim();


    const houseNumber =
        document.getElementById(
            "houseNumber"
        ).value.trim();


    const details =
        document.getElementById(
            "details"
        ).value.trim();


    return {

        customer: {

            name: fullName,

            email: email,

            phone: phone

        },


        delivery: {

            state: state,

            lga: lga,

            area: area,

            street: street,

            houseNumber: houseNumber,

            details: details

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
                    Initialize payment with Paystack.
                    Do NOT clear the cart yet —
                    it will be cleared only after
                    payment is successfully verified.
                */

                const email =
                    document.getElementById(
                        "email"
                    ).value.trim();


                /*
                    Store email for payment retry.
                    This is needed if the customer
                    needs to retry payment later.
                */

                sessionStorage.setItem(
                    "afLastOrderEmail",
                    email
                );


                const paymentResponse =
                    await fetch(
                        PAYMENTS_API_URL,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    orderId:
                                        createdOrder.id,
                                    email: email
                                })

                        }
                    );


                let paymentData = null;


                try {

                    paymentData =
                        await paymentResponse.json();

                } catch (error) {

                    paymentData = null;

                }


                if (
                    !paymentResponse.ok ||
                    !paymentData?.success ||
                    !paymentData?.data?.authorization_url
                ) {

                    throw new Error(

                        paymentData?.message ||
                        "Unable to initialize payment. Please try again."

                    );

                }


                /*
                    Redirect to Paystack for payment.
                    Cart is preserved until payment
                    is successfully verified.
                */

                window.location.href =
                    paymentData.data.authorization_url;

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