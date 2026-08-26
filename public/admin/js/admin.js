/* =========================================================
   A.F. BOOKSTORE
   ADMIN JAVASCRIPT
========================================================= */


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