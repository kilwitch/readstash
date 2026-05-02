require('dotenv').config();

const express= require('express')
const mongoose=require('mongoose')
const path= require('path');
const cookieParser= require('cookie-parser')
const { checkForAuthenticationCookie  } = require('./middlewares/authentication');

const userRoute=require('./routes/user');

const app=express();

mongoose.connect(process.env.MONGO_URL).then((e)=>console.log('Mongodb connected'))

app.set('view engine', 'ejs')
app.set('views', path.resolve('./views'))

app.use(express.urlencoded({extended: false}))
app.use(express.static(path.resolve('./public')))
app.use(express.static('public'));


app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"))

app.get('/', (req,res)=>{
    res.render('home');
})

app.use('/user', userRoute);
const PORT=process.env.PORT|| 8000;
app.listen(PORT, ()=>
    console.log('server started at http://localhost:8000')
)