/* =========================================================
   A.F. BOOKSTORE
   ORDER SUCCESS
========================================================= */


/* =========================================================
   GET ELEMENTS
========================================================= */

const orderIdElement =
    document.getElementById(
        "orderId"
    );



/* =========================================================
   GET LAST ORDER ID
========================================================= */

const orderId =
    sessionStorage.getItem(
        "afLastOrderId"
    );



/* =========================================================
   DISPLAY ORDER ID
========================================================= */

if (
    orderIdElement
) {

    if (orderId) {

        orderIdElement.textContent =
            orderId;

    } else {

        /*
            This normally means the customer
            opened this page directly instead
            of arriving after a successful order.
        */

        orderIdElement.textContent =
            "Unavailable";

    }

}



/* =========================================================
   PAGE TITLE
========================================================= */

if (orderId) {

    document.title =
        `Order ${orderId} — A.F. Bookstore`;

}