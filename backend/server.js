import express from 'express'
import cors from 'cors'
import multer from 'multer'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { promisify } from 'util'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = 3000

// Middleware
app.use(cors())
app.use(express.json())

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads')
if (!existsSync(uploadsDir)) {
  mkdir(uploadsDir, { recursive: true })
}

app.use('/uploads', express.static(uploadsDir))

// Database setup
const db = new sqlite3.Database('instagram.db')
const dbRun = promisify(db.run.bind(db))
const dbGet = promisify(db.get.bind(db))
const dbAll = promisify(db.all.bind(db))

// Initialize database
db.serialize(() => {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      caption TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(post_id) REFERENCES posts(id)
    );
  `
  db.exec(schema)
})

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// Routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    await dbRun('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword])
    
    const user = await dbGet('SELECT id, username FROM users WHERE username = ?', [username])
    const token = jwt.sign(user, 'your-secret-key')
    
    res.json({ ...user, token })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(400).json({ message: 'Username already exists' })
  }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username])
    
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' })
    }

    const { password: _, ...userWithoutPassword } = user
    const token = jwt.sign(userWithoutPassword, 'your-secret-key')
    
    res.json({ ...userWithoutPassword, token })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/posts', async (req, res) => {
  try {
    const userId = req.user?.id || 0
    const posts = await dbAll(`
      SELECT 
        p.*,
        u.username,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `, [userId])
    
    res.json(posts)
  } catch (err) {
    console.error('Error fetching posts:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('Received post request:', {
      file: req.file,
      body: req.body,
      user: req.user
    })

    if (!req.file) {
      console.error('No file uploaded')
      return res.status(400).json({ message: 'No image file provided' })
    }

    const { caption } = req.body
    const imagePath = `/uploads/${req.file.filename}`

    console.log('Creating post with:', {
      userId: req.user.id,
      imagePath,
      caption
    })

    const result = await dbRun(
      'INSERT INTO posts (user_id, image_path, caption) VALUES (?, ?, ?)',
      [req.user.id, imagePath, caption]
    )

    const newPost = {
      id: result.lastID,
      image_path: imagePath,
      caption,
      user_id: req.user.id,
      username: req.user.username,
      created_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      liked: false
    }

    console.log('Post created successfully:', newPost)
    res.json(newPost)
  } catch (err) {
    console.error('Error creating post:', err)
    res.status(500).json({ 
      message: 'Error creating post',
      error: err.message 
    })
  }
})

app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    const existingLike = await dbGet(
      'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
      [req.user.id, id]
    )

    if (existingLike) {
      await dbRun('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, id])
    } else {
      await dbRun('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, id])
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error liking post:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/users/:username', async (req, res) => {
  const { username } = req.params
  const userId = req.user?.id || 0

  try {
    const user = await dbGet('SELECT id, username FROM users WHERE username = ?', [username])
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const posts = await dbAll(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as liked
      FROM posts p
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId, user.id])
    
    res.json({ ...user, posts })
  } catch (err) {
    console.error('Error fetching user profile:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const result = await dbRun(
      'INSERT INTO comments (user_id, post_id, text) VALUES (?, ?, ?)',
      [req.user.id, id, text]
    );

    const newComment = {
      id: result.lastID,
      user_id: req.user.id,
      post_id: id,
      text,
      created_at: new Date().toISOString()
    };

    res.json(newComment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  const { id } = req.params;

  try {
    const comments = await dbAll(
      'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC',
      [id]
    );

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' })
    }
    return res.status(400).json({ message: 'Error uploading file' })
  }
  res.status(500).json({ message: 'Server error' })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
}) 