/* =========================================================
   MOBILE MENU
========================================================= */

const menuBtn =
    document.getElementById("menuBtn");

const mobileMenu =
    document.getElementById("mobileMenu");

const closeMenu =
    document.getElementById("closeMenu");


if (menuBtn && mobileMenu) {

    menuBtn.addEventListener(
        "click",
        () => {

            mobileMenu.classList.add(
                "active"
            );

        }
    );

}


if (closeMenu && mobileMenu) {

    closeMenu.addEventListener(
        "click",
        () => {

            mobileMenu.classList.remove(
                "active"
            );

        }
    );

}


document
    .querySelectorAll(".mobile-links a")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                if (mobileMenu) {

                    mobileMenu.classList.remove(
                        "active"
                    );

                }

            }
        );

    });