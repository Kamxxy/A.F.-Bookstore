/* =========================================================
   A.F. BOOKSTORE
   SHARED ADMIN SIDEBAR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const sidebarContainer =
        document.getElementById("adminSidebar");

    if (!sidebarContainer) {
        return;
    }


    /* =====================================================
       CURRENT PAGE
    ===================================================== */

    const currentPath =
        window.location.pathname;


    /* =====================================================
       SIDEBAR HTML
    ===================================================== */

    sidebarContainer.innerHTML = `

        <aside class="admin-sidebar">

            <div class="admin-brand">

                <span class="brand-mark">
                    A.F.
                </span>

                <span class="brand-name">
                    BOOKSTORE
                </span>

            </div>


            <nav class="admin-nav">

                <a
                    href="/admin"
                    class="admin-nav-link ${
                        currentPath === "/admin"
                            ? "active"
                            : ""
                    }"
                >
                    <span>◈</span>
                    Dashboard
                </a>


                <a
                    href="/admin/books"
                    class="admin-nav-link ${
                        currentPath === "/admin/books"
                            ? "active"
                            : ""
                    }"
                >
                    <span>▣</span>
                    Books
                </a>


                <a
                    href="/admin/orders"
                    class="admin-nav-link ${
                        currentPath === "/admin/orders"
                            ? "active"
                            : ""
                    }"
                >
                    <span>◉</span>
                    Orders
                </a>


                <button
                    type="button"
                    class="admin-nav-link"
                    id="adminLogoutButton"
                >
                    <span>↪</span>
                    Logout
                </button>

            </nav>


            <div class="admin-sidebar-bottom">

                <a
                    href="/"
                    class="admin-nav-link"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span>←</span>
                    View Store
                </a>

            </div>

        </aside>

    `;


    /* =====================================================
       LOGOUT
    ===================================================== */

    const logoutButton =
        document.getElementById(
            "adminLogoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdmin
        );

    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    const menuButton =
        document.querySelector(
            ".admin-menu-btn"
        );


    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );


    if (
        menuButton &&
        sidebar
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );


        /* Close sidebar after navigation */

        const navLinks =
            sidebar.querySelectorAll(
                ".admin-nav-link"
            );


        navLinks.forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );

                }
            );

        });

    }

});


/* =========================================================
   LOGOUT
========================================================= */

async function logoutAdmin() {

    try {

        await fetch(
            "/api/admin/logout",
            {
                method: "POST"
            }
        );

    }

    catch (error) {

        console.error(
            "Admin logout error:",
            error
        );

    }


    window.location.href =
        "/admin/login";

}