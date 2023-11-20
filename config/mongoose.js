var mongoose = require('mongoose')

// var database = () => {
//     mongoose.connect("mongodb://127.0.0.1:27017/project01").then(() => {
//         console.log('db attached successfully')
//     }).catch((err) => {
//         console.log(err);
//     })
// }

var database = async() => {
    try {
        const res = await mongoose.connect("mongodb://127.0.0.1:27017/ecom01")
        console.log('db connected successfully');
    } catch (error) {
        console.log(error);
    }  
}

module.exports = database;