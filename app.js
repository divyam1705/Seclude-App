require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const encrypt =require("mongoose-encryption");

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userschema=new mongoose.Schema({
  email:String,
  password:String
});
///
userschema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User=mongoose.model("user",userschema);

app.get("/",(req,res)=>{
  res.render("Home");
});

app.get("/login",(req,res)=>{
  res.render("Login");
});

app.get("/register",(req,res)=>{
  res.render("Register");
});

app.post("/register",(req,res)=>{
  const newuser=new User({
    email:req.body.username,
    password:req.body.password
  });
  newuser.save((err)=>{
    if(!err){res.render("secrets");}
    else{console.log(err);}
  });
});

app.post("/login",(req,res)=>{
  const recmail=req.body.username;
  const recpass=req.body.password;
  User.findOne({email:recmail},(err,founduser)=>{
    if (err) throw err
    if(!founduser){console.log("User not found");}
    else if(founduser.password!==recpass){
      console.log("Incorrect password");
    }
    else{res.render("secrets");}
  });
});





app.listen(3000,()=>{
  console.log("connected to server 3000");
});
