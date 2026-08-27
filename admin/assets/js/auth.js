/* =========================================================
   A.F. BOOKSTORE
   ADMIN FRONTEND AUTHENTICATION
========================================================= */


/* ================= API ================= */

const ADMIN_AUTH_API =
    "/api/admin/auth";


/* =========================================================
   CHECK ADMIN AUTHENTICATION
========================================================= */

async function requireAdminAuth() {

    try {

        const response =
            await fetch(
                ADMIN_AUTH_API,
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        if (!response.ok) {

            return false;

        }


        const result =
            await response.json();


        return (
            result.success === true
        );

    }


    catch (error) {

        console.error(
            "Admin authentication check failed:",
            error
        );


        return false;

    }

}


/* =========================================================
   ADMIN API HEADERS
========================================================= */

function getAdminHeaders(
    additionalHeaders = {}
) {

    return {
        ...additionalHeaders
    };

}