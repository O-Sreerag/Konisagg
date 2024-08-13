const multer = require('multer');

const storage = multer.memoryStorage(); // Store files in memory

const upload = multer({ storage });

module.exports = {
    productImagesFolder: upload.array('productimage'), // For multiple images
    productImagesFolderSingle: upload.single('productimage'), // For a single image
    categoryImagesFolder: upload.single('categoryimage'),
    categoryImagesFolderUpdate: upload.single('updatecategoryimage'),
    userImagesFolder: upload.single('userimage'),
    offerImagesFolder: upload.single('offerimage'),
    bannerImagesFolder: upload.single('bannerimage'),
};
