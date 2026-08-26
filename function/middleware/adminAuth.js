const jwt = require('jsonwebtoken');


function adminAuth(req, res, next) {

    try {

        /* =========================================================
           GET TOKEN FROM COOKIE
        ========================================================= */

        const token =
            req.cookies &&
            req.cookies.adminToken;


        if (!token) {

            /* =====================================================
               PAGE REQUEST
               Redirect unauthenticated admin pages to login
            ===================================================== */

            if (
                req.originalUrl.startsWith('/admin')
            ) {

                return res.redirect(
                    '/admin/login'
                );

            }


            /* =====================================================
               API REQUEST
            ===================================================== */

            return res.status(401).json({

                success: false,

                message:
                    'Authentication required'

            });

        }


        /* =========================================================
           VERIFY TOKEN
        ========================================================= */

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        /* =========================================================
           CHECK ADMIN ROLE
        ========================================================= */

        if (
            decoded.role !== 'admin'
        ) {

            if (
                req.originalUrl.startsWith('/admin')
            ) {

                return res.redirect(
                    '/admin/login'
                );

            }


            return res.status(403).json({

                success: false,

                message:
                    'Admin access required'

            });

        }


        /* =========================================================
           ATTACH ADMIN TO REQUEST
        ========================================================= */

        req.admin = decoded;


        /* =========================================================
           CONTINUE
        ========================================================= */

        next();

    }

    catch (error) {

        console.error(
            'Admin authentication error:',
            error.message
        );


        /* =========================================================
           INVALID / EXPIRED TOKEN
        ========================================================= */

        if (
            req.originalUrl.startsWith('/admin')
        ) {

            return res.redirect(
                '/admin/login'
            );

        }


        return res.status(401).json({

            success: false,

            message:
                'Invalid or expired token'

        });

    }

}


module.exports = adminAuth;