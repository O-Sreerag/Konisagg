const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (fileBuffer, folder, filename, transformation) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: folder,
                public_id: filename,
                overwrite: true,
                transformation: transformation ? [transformation] : undefined,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

const uploadImages = async (req, res, next, folder, transformation) => {
    try {
        const uploadedImages = [];

        for (const file of req.files) {
            const filename = `${Date.now()}-${file.originalname}`;
            const imageUrl = await uploadToCloudinary(file.buffer, folder, filename, transformation);
            uploadedImages.push(imageUrl);
        }

        // Store the URLs in the request object for further processing
        req.uploadedImages = uploadedImages;

        next();
    } catch (error) {
        return res.status(500).send('Error uploading images.');
    }
};

const uploadSingleImage = async (req, res, next, folder, transformation) => {
    try {
        if (!req.file) {
            return res.status(400).send('No image uploaded.');
        }

        const filename = `${Date.now()}-${req.file.originalname}`;
        const imageUrl = await uploadToCloudinary(req.file.buffer, folder, filename, transformation);

        // Store the URL in the request object for further processing
        req.uploadedImage = imageUrl;

        next();
    } catch (error) {
        return res.status(500).send('Error uploading image.');
    }
};

const uploadSingleProductImage = (req, res, next) => {
    const transformation = { width: 740, height: 740, crop: 'crop' };
    uploadSingleImage(req, res, next, 'products', transformation);
};

const uploadProductImages = (req, res, next) => {
    const transformation = { width: 740, height: 740, crop: 'crop' };
    uploadImages(req, res, next, 'products', transformation);
};

const uploadProductOfferImage = (req, res, next) => {
    const transformation = { width: 600, height: 334, crop: 'crop' };
    uploadSingleImage(req, res, next, 'product_offer', transformation);
};

const uploadCategoryOfferImage = (req, res, next) => {
    const transformation = { width: 600, height: 712, crop: 'crop' };
    uploadSingleImage(req, res, next, 'category_offer', transformation);
};

const uploadBannerImage = (req, res, next) => {
    const transformation = { width: 966, height: 542, crop: 'crop' };
    uploadSingleImage(req, res, next, 'banner', transformation);
};

const uploadUserImage = (req, res, next) => {
    uploadSingleImage(req, res, next, 'user');
};

const uploadCategoryImage = (req, res, next) => {
    uploadSingleImage(req, res, next, 'category');
};

module.exports = {
    uploadProductImages,
    uploadProductOfferImage,
    uploadCategoryOfferImage,
    uploadBannerImage,
    uploadUserImage,
    uploadCategoryImage,
    uploadSingleProductImage,
};
