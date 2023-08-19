const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
// app.use('/uploads', express.static(__dirname + '/uploads'));
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));
// app.use('/uploads', express.static('D:/FT/CN Web/mern-blog/server/uploads'));

mongoose.connect('mongodb+srv://bachtuhoa2002:84h4EniDFUw8nQH2@cluster0.aosogya.mongodb.net/?retryWrites=true&w=majority');

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try{
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});

  app.post('/login', async (req,res) => {
    const {username,password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      // logged in
      jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id:userDoc._id,
          username,
        });
      });
    } else {
      res.status(400).json('wrong credentials');
    }
  });

  // Cập nhật endpoint '/google-login'
app.post('/googleLogin', async (req, res) => {
  const { user } = req.body;
  console.log(req.body)

  try {
    // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu hay chưa
    let existingUser = await User.findOne({ googleId: user.sub });

    if (!existingUser) {
      // Nếu người dùng chưa tồn tại, tạo một bản ghi mới
      existingUser = await User.create({
        googleId: user.sub,
        username: user.email,
        password:bcrypt.hashSync(user.jti,salt),
        // Lưu trữ thông tin khác từ đối tượng người dùng Google nếu cần thiết
      });
    }

    // Trả về thông tin người dùng đã lưu trữ
    jwt.sign({username: existingUser.username,id:existingUser._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id: existingUser._id,
      username: existingUser.username,
      });
    });
    // res.json({
    //   id: existingUser._id,
    //   username: existingUser.username,
    // });
  } catch (error) {
    console.error("An error occurred while handling Google login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});

// app.post('/logout', (req,res) => {
//   res.cookie('token', '').json('ok');
// });

app.post('/logout', (req, res) => {
  // Xóa cookie 'token'
  res.cookie('token', '');

  // Đặt lại giá trị userInfo thành null hoặc giá trị mặc định tương ứng
  req.session.userInfo = null; // Hoặc req.session.userInfo = { id: null, name: null, ... } tuỳ theo cấu trúc userInfo

  res.json('ok');
});




app.delete('/deletecomment', async (req, res) => {
  const { idCmt } = req.body;

  try {
    // Xóa comment theo ID
    const comment = await Comment.findByIdAndDelete(idCmt);
    console.log(comment)
    console.log(idCmt)
    if (!comment) {
      return res.status(404).send('Không tìm thấy comment');
    }

    res.status(200).send('Comment đã được xóa thành công');
  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi xóa comment');
  }
});


app.post('/comment/:id_post', async (req, res) => {
  const { id_post } = req.params;
  const { content, author } = req.body;

  try {
    const comment = await Comment.create({
      content,
      post: id_post,
      author,
    });

    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
});

app.get('/postcomments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const comments = await Comment.find({ post: id }).populate('author', 'username').exec();

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path + '.' + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  console.log(token)
  console.log(req.file)

  try {
    const decoded = jwt.verify(token, secret);

    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: decoded.id,
    });
    res.json(postDoc);
  } catch (err) {
    console.error("An error occurred while verifying JWT:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Thêm xử lý cho yêu cầu GET '/uploads'
app.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = __dirname + '/uploads/' + filename;
  res.sendFile(filePath);
});


app.put('/post',uploadMiddleware.single('file'), async (req,res) => {
  let newPath = null;
  if (req.file) {
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
  }

  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
    const {id,title,summary,content} = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json('you are not the author');
    }
    await postDoc.update({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });

    res.json(postDoc);
  });

});

app.get('/post', async (req,res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20)
  );
});

app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})

app.listen(4000);
//