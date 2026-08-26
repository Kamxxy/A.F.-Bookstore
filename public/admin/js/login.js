/* =========================================================
   A.F. BOOKSTORE
   ADMIN LOGIN
========================================================= */

/* ================= API ================= */

const LOGIN_API_URL =
    "/api/admin/login";


/* ================= DOM ================= */

const loginForm =
    document.getElementById("loginForm");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");


/* ================= LOGIN ================= */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const username =
            document.getElementById(
                "username"
            ).value.trim();


        const password =
            document.getElementById(
                "password"
            ).value;


        loginMessage.textContent =
            "";


        loginButton.disabled =
            true;


        loginButton.textContent =
            "Signing In...";


        try {

            const response =
                await fetch(
                    LOGIN_API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                username,
                                password
                            })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Invalid username or password"
                );

            }


            if (!result.success || !result.token) {

                throw new Error(
                    result.message ||
                    "Login failed"
                );

            }


            /* =================
               STORE TOKEN
            ================= */

            localStorage.setItem(
                "adminToken",
                result.token
            );


            /* =================
               REDIRECT
            ================= */

            window.location.href =
                "/admin";

        }

        catch (error) {

            console.error(
                "Admin login error:",
                error
            );


            loginMessage.textContent =
                error.message;

        }

        finally {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "Sign In";

        }

    }
);