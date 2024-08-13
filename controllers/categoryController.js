const mongoose = require('mongoose');
const categoryModel = require('../models/categoryModel')
const productModel = require('../models/productModel')

let categoryError

// const categories = async (req,res,next) => {
//     try {
//         const categories = await categoryModel.aggregate([
//             {
//                 $project: {
//                     _id: 1,
//                     name: 1,
//                     image: 1, 
//                     parentCategory: 1,
//                     subCategories: 1,
//                     tier: 1,
//                     productCount: { $size: { $ifNull: ['$products', []] } },
//                     createdAt: 1,
//                     updatedAt: 1,
//                 }
//             }
//         ])

//         console.log(categories)
//         const parentCategories = await categoryModel.find({ tier: { $ne: 2 } })
//         console.log("finding category list and displaying "+categories);
//         res.render('admin/categories', {categoryList: categories, pCategoryList:parentCategories, error: categoryError})
//         categoryError = null
//     } catch(error) {
//         console.log(error);
//     }
// }

const ITEMS_PER_PAGE = 5; // Number of categories per page

const categories = async (req, res, next) => {
  try {
    const page = +req.query.page || 1; // Get page number from query parameter or default to 1

    const totalCategories = await categoryModel.countDocuments();
    const totalPages = Math.ceil(totalCategories / ITEMS_PER_PAGE);

    const categoriesData = await categoryModel.aggregate([
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          parentCategory: 1,
          subCategories: 1,
          tier: 1,
          productCount: { $size: { $ifNull: ['$products', []] } },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $skip: (page - 1) * ITEMS_PER_PAGE,
      },
      {
        $limit: ITEMS_PER_PAGE,
      },
    ]);

    const parentCategories = await categoryModel.find({ tier: { $ne: 2 } });

    res.render('admin/categories', {
      categoryList: categoriesData,
      pCategoryList: parentCategories,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalCategories,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: totalPages,
      pageNumbers: Array.from({ length: totalPages }, (_, index) => index + 1),
      Message: req.session?.Message
    });

    if(req.session.Message) {
        req.session.Message = null
    }
  } catch (error) {
    console.log(error);
    // Handle errors or return an error page
    res.status(500).send('Internal Server Error');
  }
};

const searchCategory = async (req, res) => {
    try {
        console.log("search product on shop root")

        let payload = req.body.payload.trim()
        console.log(payload)
        let search = await categoryModel.aggregate([
            {
                $match: {
                    name: { $regex: new RegExp('^' + payload + '.*', 'i') }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    parentCategory: 1,
                    subCategories: 1,
                    tier: 1,
                    productCount: { $size: { $ifNull: ['$products', []] } },
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ]).exec();
        search = search.slice(0, 10);
        console.log(search)
        if(payload) {
            if(search) {
                res.send({payload: search})
            } else {
                res.send({payload: []})
            }
        }else {
            const search = await categoryModel.aggregate([
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        image: 1, 
                        parentCategory: 1,
                        subCategories: 1,
                        tier: 1,
                        productCount: { $size: { $ifNull: ['$products', []] } },
                        createdAt: 1,
                        updatedAt: 1,
                    }
                }
            ])
            res.send({payload: search})
        }
    } catch (error) {
        console.log(error)
    }
}

const getParentSubCategories = async (req, res) => {
    try {
        console.log("getting parent and sub categories of the respective category")
       
        const categoryId = req.body.categoryId
        console.log(categoryId)
        const validCategoryId = new mongoose.Types.ObjectId(categoryId);

        const category = await categoryModel.aggregate([
        {
            $match: {
                _id: validCategoryId
            }
        },
        {
            $lookup: {
                from: 'categoryinfos', 
                localField: 'parentCategory',
                foreignField: '_id',
                as: 'parentCategoryData'
            }
        },
        {
            $lookup: {
                from: 'categoryinfos',
                localField: 'subCategories',
                foreignField: '_id',
                as: 'subCategoriesData'
            }
        },
        {
            $project: {
                _id: 1,
                NewparentCategory: {
                    _id: { $arrayElemAt: ['$parentCategoryData._id', 0] },
                    name: { $arrayElemAt: ['$parentCategoryData.name', 0] }
                },
                NewsubCategories: {
                    $map: {
                        input: '$subCategoriesData',
                        as: 'subCat',
                        in: {
                            _id: '$$subCat._id',
                            subName: '$$subCat.name'
                        }
                    }
                },
            }
        }
    ]);
    console.log(category[0])

    res.status(200).json(category[0]);

    } catch(error) {
        console.log(error)
    }
}

const addCategorySubmit = async (req, res, next) => {
    try {
        let {categoryname, selectedCategoryId} = req.body;
        // const categoryimage = req.file;
        const categoryimage = req.uploadedImage;

        console.log("checking category name, parent, image details on add form submit");
        console.log(categoryname);
        console.log(selectedCategoryId);
        console.log(categoryimage);

        // Check if category with the same name already exists
        const existingCategory = await categoryModel.findOne({ name: categoryname });
        if (existingCategory) {
            // return res.status(409).send('Category name already exists');
            req.session.Message = "This name already exists. Please choose another name"
            return res.redirect('/admin/categories')
        }

        const newCategory = new categoryModel({
            name: categoryname,
        })
        if(categoryimage) {
            // newCategory.image = categoryimage.filename
            newCategory.image = categoryimage
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

        req.session.Message = 'Category added successfully'
        res.redirect('/admin/categories')
        return
    } catch (error) {
        console.log(error);
        res.status(500).send('Error adding category');
    }
};

const updateCategorySubmit = async (req, res, next) => {
    try {
        let {updatecategoryid ,updatecategoryname, updateSelectedCategoryId} = req.body;
        // const updatecategoryimage = req.file;
        const updatecategoryimage = req.uploadedImage;

        console.log("checking category name, parent, image details on update form submit");
        console.log(updatecategoryid);
        console.log(updatecategoryname);
        console.log(updateSelectedCategoryId);
        console.log(updatecategoryimage);

        // Check if category with the same name already exists
        const existingCategory = await categoryModel.findOne({ name: updatecategoryname });
        if (existingCategory && !updatecategoryimage) {

            req.session.Message = 'Category name already exists'
            res.redirect('/admin/categories')
            // return res.status(409).send('Category name already exists');
            // updateFormError = "This name already exists. Please choose another name"
            // return res.redirect('/admin/categories')
        }

        const parts = updateSelectedCategoryId.split('-')
        const part1 = parts[1]
        console.log(part1)

        const updateCategory = await categoryModel.findOne({_id: updatecategoryid})
        console.log(updateCategory)

        
        if(updatecategoryimage) {
            await categoryModel.updateOne(
                { _id: updatecategoryid },
                // { $set: { image: updatecategoryimage.filename } },
                { $set: { image: updatecategoryimage } },
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

        if(updateCategory.tier == 2) {
           console.log("The category to be updated is a child category")
           
            const oldParentCategory = await categoryModel.findOne(
               { _id: updatecategoryid }, 
               { _id: 0, parentCategory: 1 }
              )  

            const oldParentCategoryId = oldParentcategory.parentCategory
              
            console.log(oldParentCategoryId, part1)
            
            if(String(oldParentCategoryId) !== String(part1)) {

                console.log("new parent is different from old one.")

                // update the parent category id in to the new parent category
                await categoryModel.updateOne(
                    { _id: updatecategoryid },
                    { $set: { parentCategory: part1 } },
                    { upsert: true })
                // await categoryModel.findByIdAndUpdate(updatecategoryid, {
                //     $set: { parentCategory: part1 }
                // });
                        
                // update the new parent category's subcategories field by adding another sub category id into it
                await categoryModel.updateOne(
                    { _id:part1 }, 
                    { $push: { subCategories: updatecategoryid }})
                // await categoryModel.findByIdAndUpdate(part1, {
                //     $addToSet: { subCategories: updatecategoryid }
                // });
                
                // update the old parent category's subcategories field by deleting the current updatecategoryid from it
                await categoryModel.updateOne(
                    { _id: oldParentCategoryId }, 
                    { $pull: { subCategories: updatecategoryid }})
                // await categoryModel.findByIdAndUpdate(oldParentCategoryId, {
                //     $pull: { subCategories: updatecategoryid }
                // });
                    
                console.log("successfully updated the current category with the new parent, deleted the current category id from the old parent, and added the id into the subcategories to the new parent")
            } else {
                console.log("both the old parent and the new parent is the same")
            }
            
        } else {
            console.log("The category to be updated is a parent category")
        }
        req.session.Message = 'Category updated successfully'
        res.redirect('/admin/categories')
        return
        // res.send('Category updated successfully');
    } catch (error) {
        console.log(error);
    }
};

const deleteCategorySubmit = async (req, res, next) => {
    try {
        console.log("delete category root")

        const categoryId = req.query.categoryId;
        const category = await categoryModel.findById(categoryId);
        console.log("category to be deleted")
        console.log(category)

        if (!category) {
            req.session.Message = 'Category not found'
            res.redirect('/admin/categories')
        }

        if (category.tier === 1) {
            // Parent category
            if (category.subCategories.length > 0) {
                req.session.Message = 'Cannot delete parent category with subcategories'
                res.redirect('/admin/categories')
            } else {
                await categoryModel.findByIdAndDelete(categoryId);
                req.session.Message = 'Parent category deleted successfully'
                res.redirect('/admin/categories')
            }
        } else {
            // Subcategory
            const parentCategory = await categoryModel.findById(category.parentCategory);
            console.log("parentCategory of the category to be deleted")
            console.log(parentCategory)

            if (!parentCategory) {
                req.session.Message = 'Parent category not found'
                res.redirect('/admin/categories')
            }

            // Save products before deletion
            const productsToDelete = category.products;
            console.log("products to delete")
            console.log(productsToDelete)

            // Update parent category removing current category from subcategories
            await categoryModel.findByIdAndUpdate(parentCategory._id, {
                $pull: { subCategories: categoryId },
                $pullAll: { products: productsToDelete } // Remove products from parent category
            });

            // Delete products associated with this subcategory
            // await productModel.deleteMany({ _id: { $in: productsToDelete } });

            productsToDelete.forEach(async (item) => {
                await productModel.deleteMany({_id: item})
            })

            // Delete subcategory
            await categoryModel.findByIdAndDelete(categoryId);
            req.session.Message = 'Subcategory deleted successfully'
            res.redirect('/admin/categories')
            return
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    categories, 
    searchCategory,
    getParentSubCategories,
    addCategorySubmit, 
    updateCategorySubmit, 
    deleteCategorySubmit}