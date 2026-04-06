const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 이미지 업로드 설정
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 1. 메인 페이지 (목록 보기)
app.get('/', async (req, res) => {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.render('index', { posts: result.rows });
});

// 2. 글쓰기 페이지
app.get('/write', (req, res) => res.render('write'));

// 3. 글 저장 로직
app.post('/post', upload.single('image'), async (req, res) => {
    const { title, wrong_part, corrected_part, password } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    await pool.query(
        'INSERT INTO posts (title, image_url, wrong_part, corrected_part, password) VALUES ($1, $2, $3, $4, $5)',
        [title, imageUrl, wrong_part, corrected_part, password]
    );
    res.redirect('/');
});

// 4. 상세 보기 (비밀번호 확인)
app.post('/post/:id', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = result.rows[0];

    if (post && post.password === password) {
        res.render('detail', { post });
    } else {
        res.send("<script>alert('비밀번호가 틀렸습니다.'); history.back();</script>");
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
