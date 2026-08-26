const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });

        }

        const parts =
            authHeader.split(' ');

        if (
            parts.length !== 2 ||
            parts[0] !== 'Bearer'
        ) {

            return res.status(401).json({
                success: false,
                message: 'Invalid authorization format'
            });

        }

        const token = parts[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        if (decoded.role !== 'admin') {

            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });

        }

        req.admin = decoded;

        next();

    } catch (error) {

        console.error(
            'Admin authentication error:',
            error.message
        );

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });

    }

}

module.exports = adminAuth;