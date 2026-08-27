const multer = require("multer");
const path = require("path");
const fs = require("fs");


/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

const uploadDirectory =
    path.join(
        __dirname,
        "../uploads/covers"
    );


/*
   Create the directory automatically
   if it does not exist.
*/

if (!fs.existsSync(uploadDirectory)) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );

}


/* =========================================================
   STORAGE
========================================================= */

const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    uploadDirectory
                );

            },


        filename:
            function (
                req,
                file,
                cb
            ) {

                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                const filename =
                    `book-${Date.now()}-${Math.round(
                        Math.random() * 1E9
                    )}${extension}`;


                cb(
                    null,
                    filename
                );

            }

    });


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

        storage,

        fileFilter,

        limits: {

            fileSize:
                5 * 1024 * 1024

        }

    });


module.exports =
    upload;