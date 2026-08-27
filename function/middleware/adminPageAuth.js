const jwt = require('jsonwebtoken');


function adminPageAuth(req, res, next) {

    try {

        const token =
            req.cookies?.adminToken;


        if (!token) {

            return res.redirect(
                '/admin/login'
            );

        }


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        if (
            decoded.role !== 'admin'
        ) {

            return res.redirect(
                '/admin/login'
            );

        }


        req.admin = decoded;

        next();

    }

    catch (error) {

        console.error(
            'Admin page authentication error:',
            error.message
        );


        return res.redirect(
            '/admin/login'
        );

    }

}


module.exports = adminPageAuth;