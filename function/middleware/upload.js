const multer = require("multer");


/* =========================================================
   FILE FILTER
========================================================= */

function fileFilter(
    req,
    file,
    cb
) {

    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"

    ];


    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {

        cb(
            null,
            true
        );

    }

    else {

        cb(
            new Error(
                "Only JPG, PNG, WEBP and GIF images are allowed."
            ),
            false
        );

    }

}


/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const upload =
    multer({

        storage:
            multer.memoryStorage(),

        fileFilter,

        limits: {

            fileSize:
                5 * 1024 * 1024

        }

    });


module.exports =
    upload;