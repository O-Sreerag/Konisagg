const multer = require('multer')


const storage1 = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/multer/products/')
    },
    filename:function(req,file,cb){
        const name =Date.now()+"-"+file.originalname
        cb(null,name)
    }
})

const storage2 = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/multer/categories/')
    },
    filename:function(req,file,cb){
        const name =Date.now()+"-"+file.originalname
        cb(null,name)
    }
})

const storage3 = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/multer/users/')
    },
    filename:function(req,file,cb){
        const name =Date.now()+"-"+file.originalname
        cb(null,name)
    }
})


const productImagesFolder =multer({storage:storage1})
const categoryImagesFolder =multer({storage:storage2})
const userImagesFolder =multer({storage:storage3})

module.exports= {productImagesFolder, categoryImagesFolder, userImagesFolder}