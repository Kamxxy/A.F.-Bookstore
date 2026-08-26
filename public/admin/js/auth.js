/* =========================================================
   A.F. BOOKSTORE
   ADMIN AUTHENTICATION
========================================================= */


/* ================= TOKEN ================= */

function getAdminToken() {

    return localStorage.getItem(
        "adminToken"
    );

}


/* ================= AUTH HEADERS ================= */

function getAdminHeaders(
    headers = {}
) {

    const token =
        getAdminToken();


    if (token) {

        return {

            ...headers,

            Authorization:
                `Bearer ${token}`

        };

    }


    return headers;

}


/* ================= REQUIRE AUTH ================= */

function requireAdminAuth() {

    const token =
        getAdminToken();


    if (!token) {

        window.location.href =
            "/admin/login";

        return false;

    }


    return true;

}


/* ================= LOGOUT ================= */

function adminLogout() {

    localStorage.removeItem(
        "adminToken"
    );


    window.location.href =
        "/admin/login";

}