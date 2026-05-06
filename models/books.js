const {Schema, model}=require('mongoose')

const BookSchema=new Schema({
    title:{
        type:String,
        required:true,
        unique:true,
    },
    author:{
        type:String,
        required:true,
        unique:true,
    },
    notes:{
        type:String,
        required:true,
    },
    rating:{
        type:Number,
    },
    status:"wantToRead" |"reading"| "read",
    coverImageURL:{
        type:String,
        default:'/images/book.png',
    },
})

const Book=model("book", BookSchema)
module.exports=Book;