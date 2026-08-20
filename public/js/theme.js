/* =========================================================
   A.F. BOOKSTORE
   Theme Manager
========================================================= */

(function () {

    function applySavedTheme() {

        const savedTheme =
            localStorage.getItem("af-theme");


        if (savedTheme === "light") {

            document.body.classList.add(
                "light-theme"
            );

        }

    }


    function updateThemeButton() {

        const themeToggle =
            document.getElementById(
                "themeToggle"
            );


        if (!themeToggle) return;


        const isLight =
            document.body.classList.contains(
                "light-theme"
            );


        themeToggle.textContent =
            isLight ? "☾" : "☀";


        themeToggle.setAttribute(
            "aria-label",
            isLight
                ? "Switch to dark mode"
                : "Switch to light mode"
        );


        themeToggle.setAttribute(
            "title",
            isLight
                ? "Switch to dark mode"
                : "Switch to light mode"
        );

    }


    function toggleTheme() {

        const isLight =
            document.body.classList.toggle(
                "light-theme"
            );


        localStorage.setItem(
            "af-theme",
            isLight
                ? "light"
                : "dark"
        );


        updateThemeButton();

    }


    applySavedTheme();


    document.addEventListener(
        "DOMContentLoaded",
        () => {

            const themeToggle =
                document.getElementById(
                    "themeToggle"
                );


            if (!themeToggle) return;


            themeToggle.addEventListener(
                "click",
                toggleTheme
            );


            updateThemeButton();

        }
    );

})();