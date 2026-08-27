const jwt = require('jsonwebtoken');


function adminAuth(req, res, next) {

    try {

        /* =========================================================
           GET TOKEN FROM COOKIE
        ========================================================= */

        const token =
            req.cookies?.adminToken;


        if (!token) {

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

            return res.status(403).json({

                success: false,

                message:
                    'Admin access required'

            });

        }


        /* =========================================================
           ATTACH ADMIN
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


        return res.status(401).json({

            success: false,

            message:
                'Invalid or expired token'

        });

    }

}


module.exports = adminAuth;