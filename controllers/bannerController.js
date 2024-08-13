const mongoose = require('mongoose');
const bannerModel = require('../models/bannerModel')

const adminListBanners = async(req, res) => {
    try {
        console.log("admin list banners")

        const banners = await bannerModel.find({})
        console.log(banners)

        res.render('admin/banners', {banners:banners, bannerMessage: req.session?.banners?.message})
        if (req.session && req.session.banners) {
            req.session.banners.message = null;
        }
    } catch(error) {
        console.log(error)
    }
}

const adminCreateBanners = (req, res) => {
    try {
        console.log("admin create banners")

        res.render('admin/banners-create')
    } catch(error) {
        console.log(error)
    }
}

const adminCreateBannersSubmit = async (req, res) => {
    try {
        console.log("admin banner create submit")
        const { bannerTitle, description1, description2 } = req.body;
        // const uploadedFileName = req.file.filename;
        const uploadedFileName = req.uploadedImage;
        console.log({ bannerTitle, description1, description2 }, uploadedFileName)

        // Create a new banner document using Mongoose model
        const newBanner = new bannerModel({
            image: uploadedFileName, 
            descriptions: [bannerTitle, description1, description2] 
        });
        await newBanner.save();

        if (!req.session.banners) {
            req.session.banners = {};
        }
        req.session.banners.message = "banner added successfully"
        res.redirect('/admin/banners')
    } catch (error) {
        console.log(error);
    }
};

const adminDeleteBanners = async(req, res) => {
    try {
        console.log("admin banner delete root")

        const bannerId = req.query.bannerId
        await bannerModel.findByIdAndDelete(bannerId);
        
        if (!req.session.banners) {
            req.session.banners = {};
        }
        req.session.banners.message = "banner deleted successfully"
        res.redirect('/admin/banners')
    } catch(error) {
        console.log(error)
    }
}

module.exports = {
    adminListBanners,
    adminCreateBanners,
    adminCreateBannersSubmit,
    adminDeleteBanners,
}