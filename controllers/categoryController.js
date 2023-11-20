const mongoose = require('mongoose');
const categoryModel = require('../models/categoryModel')

const categories = async (req,res,next) => {
    try {
        const categories = await categoryModel.find({})
        const parentCategories = await categoryModel.find({ tier: { $ne: 2 } })
        console.log("finding category list and displaying "+categories);
        res.render('admin/categories', {categoryList: categories, pCategoryList:parentCategories})
    } catch(error) {
        console.log(error);
    }
}

const addCategorySubmit = async (req, res, next) => {
    try { 
        let {categoryname, selectedCategoryId} = req.body;
        const categoryimage = req.file;

        console.log("checking category name, parent, image details on add form submit");
        console.log(categoryname);
        console.log(selectedCategoryId);
        console.log(categoryimage);


        const newCategory = new categoryModel({
            name: categoryname,
        })
        if(categoryimage) {
            newCategory.image = categoryimage.filename
        }
        if (selectedCategoryId !== "noId") {
            newCategory.parentCategory = selectedCategoryId;
        }
        newCategory.createdAt = newCategory.updatedAt = new Date();
        await newCategory.save();

        if (selectedCategoryId !== "noId") {
            await categoryModel.updateOne({ _id:selectedCategoryId }, { $push: { subCategories: newCategory._id }})
        } else {
            console.log('Invalid selectedCategoryId:', selectedCategoryId);
        }

        if (selectedCategoryId !== "noId") {
            const tier = await categoryModel.findOne({ _id:selectedCategoryId }, { _id:0, tier:1 })
            console.log(tier)
            if(tier.tier === 1) {
                await categoryModel.updateOne({ _id:newCategory._id }, {tier: 2})
            }
        } else {
            await categoryModel.updateOne({ _id:newCategory._id }, {tier: 1})
        }

        res.send('Category added successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error adding category');
    }
};

const updateCategorySubmit = async (req, res, next) => {
    try {
        let {updatecategoryid ,updatecategoryname, updateSelectedCategoryId} = req.body;
        const updatecategoryimage = req.file;

        console.log("checking category name, parent, image details on update form submit");
        console.log(updatecategoryid);
        console.log(updatecategoryname);
        console.log(updateSelectedCategoryId);
        console.log(updatecategoryimage);

        const parts = updateSelectedCategoryId.split('-')
        const part1 = parts[1]
        console.log(part1)

        const updateCategory = await categoryModel.findOne({_id: updatecategoryid})
        console.log(updateCategory)

        
        if(updatecategoryimage) {
            await categoryModel.updateOne(
                { _id: updatecategoryid },
                { $set: { image: updatecategoryimage.filename } },
                { upsert: true })
        }
        if (updateSelectedCategoryId !== "noId") {
            await categoryModel.updateOne(
                { _id: updatecategoryid },
                { $set: { parentCategory: part1 } },
                { upsert: true })
        }
        if (updatecategoryname) {
            await categoryModel.updateOne(
              { _id: updatecategoryid },
              {
                $set: {
                  name: updatecategoryname,
                  updatedAt: new Date()
                }
              },
              { upsert: true }
            );
          }

        if (part1 !== "noId") {
            await categoryModel.updateOne({ _id:part1 }, { $push: { subCategories: updatecategoryid }})
        } else {
            console.log('Invalid selectedCategoryId:', part1);
        }

        if (part1 !== "noId") {
            const tier = await categoryModel.findOne({ _id:part1 }, { _id:0, tier:1 })
            console.log(tier)
            if(tier.tier === 1) {
                await categoryModel.updateOne({ _id:updatecategoryid }, {tier: 2})
            }
        } else {
            await categoryModel.updateOne({ _id:updatecategoryid }, {tier: 1})
        }

        res.send('Category updated successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error adding category');
    }
};

const deleteCategorySubmit = async (req, res, next) => {

}

module.exports = {categories, addCategorySubmit, updateCategorySubmit, deleteCategorySubmit}