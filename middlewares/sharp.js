const sharp = require('sharp');
const fs = require('fs');

const cropProductImages = async (req, res, next) => {
  try {
    console.log("croping product images")
    // Check if files were uploaded successfully
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    // Loop through each uploaded file
    for (const file of req.files) {
      const imagePath = file.path; // Path of the uploaded file

      // Get the original image dimensions
      const { width: originalWidth, height: originalHeight } = await sharp(imagePath).metadata();

      // Define the crop rectangle coordinates and dimensions
      let x, y, width, height;

      const targetWidth = 740; // Target width for cropping
      const targetHeight = 740; // Target height for cropping

      const aspectRatioOriginal = originalWidth / originalHeight;
      const aspectRatioTarget = targetWidth / targetHeight;

      if (aspectRatioOriginal > aspectRatioTarget) {
        width = originalHeight * aspectRatioTarget;
        height = originalHeight;
        x = (originalWidth - width) / 2;
        y = 0;
      } else {
        width = originalWidth;
        height = originalWidth / aspectRatioTarget;
        x = 0;
        y = (originalHeight - height) / 2;
      }

      // Use Sharp to perform image cropping
      await sharp(imagePath)
        .extract({ left: Math.floor(x), top: Math.floor(y), width: Math.floor(width), height: Math.floor(height) })
        .resize(targetWidth, targetHeight)
        .toFile(`./public/multer/products/cropped-${file.filename}`);

      // Remove the original uploaded file
      fs.unlinkSync(imagePath);

      console.log(`Cropped image saved.`);
    }

    // Call the next middleware (or route handler)
    next();
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).send('Error processing images.');
  }
};

const cropProductImage = async (req, res, next) => {
  try {
    console.log("Cropping product image");

    // Check if a file was uploaded successfully
    if (!req.file) {
      return res.status(400).send('No file was uploaded.');
    }

    const imagePath = req.file.path; // Path of the uploaded file

    // Get the original image dimensions
    const { width: originalWidth, height: originalHeight } = await sharp(imagePath).metadata();

    // Define the crop rectangle coordinates and dimensions
    let x, y, width, height;

    const targetWidth = 740; // Target width for cropping
    const targetHeight = 740; // Target height for cropping

    const aspectRatioOriginal = originalWidth / originalHeight;
    const aspectRatioTarget = targetWidth / targetHeight;

    if (aspectRatioOriginal > aspectRatioTarget) {
      width = originalHeight * aspectRatioTarget;
      height = originalHeight;
      x = (originalWidth - width) / 2;
      y = 0;
    } else {
      width = originalWidth;
      height = originalWidth / aspectRatioTarget;
      x = 0;
      y = (originalHeight - height) / 2;
    }

    // Use Sharp to perform image cropping
    await sharp(imagePath)
      .extract({ left: Math.floor(x), top: Math.floor(y), width: Math.floor(width), height: Math.floor(height) })
      .resize(targetWidth, targetHeight)
      .toFile(`./public/multer/products/cropped-${req.file.filename}`);

    // Remove the original uploaded file
    fs.unlinkSync(imagePath);

    console.log(`Cropped image saved.`);

    // Call the next middleware (or route handler)
    next();
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).send('Error processing image.');
  }
};

const cropBannerImage = async (req, res, next) => {
  try {
    console.log("Cropping banner image");

    // Check if a file was uploaded successfully
    if (!req.file) {
      return res.status(400).send('No file was uploaded.');
    }

    const imagePath = req.file.path; // Path of the uploaded file

    // Get the original image dimensions
    const { width: originalWidth, height: originalHeight } = await sharp(imagePath).metadata();

    // Define the crop rectangle coordinates and dimensions
    let x, y, width, height;

    const targetWidth = 966; 
    const targetHeight = 542; 

    const aspectRatioOriginal = originalWidth / originalHeight;
    const aspectRatioTarget = targetWidth / targetHeight;

    if (aspectRatioOriginal > aspectRatioTarget) {
      width = originalHeight * aspectRatioTarget;
      height = originalHeight;
      x = (originalWidth - width) / 2;
      y = 0;
    } else {
      width = originalWidth;
      height = originalWidth / aspectRatioTarget;
      x = 0;
      y = (originalHeight - height) / 2;
    }

    // Use Sharp to perform image cropping
    await sharp(imagePath)
      .extract({ left: Math.floor(x), top: Math.floor(y), width: Math.floor(width), height: Math.floor(height) })
      .resize(targetWidth, targetHeight)
      .toFile(`./public/multer/banners/cropped-${req.file.filename}`);

    // Remove the original uploaded file
    fs.unlinkSync(imagePath);

    console.log(`Cropped image saved.`);

    // Call the next middleware (or route handler)
    next();
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).send('Error processing image.');
  }
};


const cropOfferImage = async (req, res, next) => {
  try {
    // Check if a file was uploaded successfully
    if (!req.file) {
      return res.status(400).send('Please upload a single file.');
    }

    const file = req.file; // Get the uploaded file
    const imagePath = file.path; // Path of the uploaded file
    console.log(imagePath)
    console.log(req.file)

    // Get the original image dimensions
    const { width: originalWidth, height: originalHeight } = await sharp(imagePath).metadata();

    // Define the crop rectangle coordinates and dimensions
    let targetWidth
    let targetHeight

    const offer_for = req.body.offer_for
    console.log(offer_for)
    
    if(offer_for[0] === "product") {      
      targetWidth = 600; // Target width for cropping
      targetHeight = 334; // Target height for cropping
    } else {
      targetWidth = 600; 
      targetHeight = 712; 
    }

    const aspectRatioOriginal = originalWidth / originalHeight;
    const aspectRatioTarget = targetWidth / targetHeight;

    let x, y, width, height;

    if (aspectRatioOriginal > aspectRatioTarget) {
      width = originalHeight * aspectRatioTarget;
      height = originalHeight;
      x = (originalWidth - width) / 2;
      y = 0;
    } else {
      width = originalWidth;
      height = originalWidth / aspectRatioTarget;
      x = 0;
      y = (originalHeight - height) / 2;
    }

    // Use Sharp to perform image cropping and resizing
    await sharp(imagePath)
      .extract({ left: Math.floor(x), top: Math.floor(y), width: Math.floor(width), height: Math.floor(height) })
      .resize(targetWidth, targetHeight)
      .toFile(`./public/multer/offers/cropped-${file.filename}`);

    // Remove the original uploaded file
    fs.unlinkSync(imagePath);

    console.log(`Cropped image saved.`);

    // Call the next middleware (or route handler)
    next();
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.status(500).send('Error processing the image.');
  }
};

module.exports = {
  cropProductImages,
  cropProductImage,
  cropOfferImage,
  cropBannerImage,
};
