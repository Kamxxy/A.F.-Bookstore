const fs = require("fs");
const path = require("path");

const cloudinary =
    require("../config/cloudinary");


/* =========================================================
   LOCAL UPLOAD DIRECTORY
========================================================= */

const uploadDirectory =
    path.join(
        __dirname,
        "../uploads/covers"
    );


if (!fs.existsSync(uploadDirectory)) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );

}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadBookCover(file) {

    if (!file) {
        return "";
    }


    /* =====================================================
       TRY CLOUDINARY FIRST
    ===================================================== */

    try {

        const result =
            await new Promise(
                (resolve, reject) => {

                    const stream =
                        cloudinary.uploader.upload_stream(

                            {
                                folder:
                                    "af-bookstore/covers",

                                resource_type:
                                    "image"
                            },

                            (
                                error,
                                result
                            ) => {

                                if (error) {
                                    reject(error);
                                    return;
                                }

                                resolve(result);

                            }

                        );


                    stream.end(
                        file.buffer
                    );

                }
            );


        console.log(
            "Book cover uploaded to Cloudinary:",
            result.secure_url
        );


        return {

            url:
                result.secure_url,

            storage:
                "cloudinary",

            publicId:
                result.public_id

        };

    }

    catch (error) {

        console.error(
            "Cloudinary upload failed, using local storage:",
            error.message
        );

    }


    /* =====================================================
       LOCAL FALLBACK
    ===================================================== */

    try {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        const filename =
            `book-${Date.now()}-${Math.round(
                Math.random() * 1E9
            )}${extension}`;


        const filePath =
            path.join(
                uploadDirectory,
                filename
            );


        fs.writeFileSync(
            filePath,
            file.buffer
        );


        const localUrl =
            `/uploads/covers/${filename}`;


        console.log(
            "Book cover saved locally:",
            localUrl
        );


        return {

            url:
                localUrl,

            storage:
                "local",

            publicId:
                null

        };

    }

    catch (error) {

        console.error(
            "Local cover storage failed:",
            error.message
        );

        throw new Error(
            "Unable to store book cover"
        );

    }

}


/* =========================================================
   DELETE LOCAL FILE
========================================================= */

function deleteLocalCover(
    cover
) {

    if (
        !cover ||
        !cover.startsWith(
            "/uploads/"
        )
    ) {

        return;

    }


    const filename =
        path.basename(
            cover
        );


    const filePath =
        path.join(
            uploadDirectory,
            filename
        );


    if (
        fs.existsSync(
            filePath
        )
    ) {

        fs.unlinkSync(
            filePath
        );

    }

}


module.exports = {

    uploadBookCover,

    deleteLocalCover

};