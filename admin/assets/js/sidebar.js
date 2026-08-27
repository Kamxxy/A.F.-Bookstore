/* =========================================================
   A.F. BOOKSTORE
   SHARED ADMIN SIDEBAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const sidebarContainer =
            document.getElementById(
                "adminSidebar"
            );


        if (!sidebarContainer) {

            return;

        }


        /* =================================================
           CURRENT PAGE
        ================================================= */

        const currentPath =
            window.location.pathname;


        /* =================================================
           SIDEBAR HTML
        ================================================= */

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


        /* =================================================
           LOGOUT
        ================================================= */

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


        /* =================================================
           MOBILE MENU
        ================================================= */

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


            const navLinks =
                sidebar.querySelectorAll(
                    ".admin-nav-link"
                );


            navLinks.forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            sidebar.classList.remove(
                                "open"
                            );

                        }
                    );

                }
            );

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

async function logoutAdmin() {

    try {

        const response =
            await fetch(
                "/api/admin/logout",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        /*
           We don't need to block the redirect
           if the server returns an error.

           The login page will be shown regardless.
        */

        if (!response.ok) {

            console.warn(
                "Admin logout request returned:",
                response.status
            );

        }

    }

    catch (error) {

        console.error(
            "Admin logout error:",
            error
        );

    }


    /*
       Replace the current page in browser history
       so the login page becomes the current location.
    */

    window.location.replace(
        "/admin/login"
    );

}