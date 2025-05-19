import sqlite3 from 'sqlite3'
import bcrypt from 'bcrypt'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const db = new sqlite3.Database('instagram.db')

// Helper function to run SQL queries
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

// Helper function to get data
const getData = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

async function seedDatabase() {
  try {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10)
    await runQuery('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)', ['jasper', hashedPassword])
    
    const user = await getData('SELECT id FROM users WHERE username = ?', ['jasper'])
    
    // Add some sample posts
    const samplePosts = [
      {
        image_path: 'https://picsum.photos/800/800?random=1',
        caption: 'Beautiful sunset at the beach! 🌅'
      },
      {
        image_path: 'https://picsum.photos/800/800?random=2',
        caption: 'City lights at night ✨'
      },
      {
        image_path: 'https://picsum.photos/800/800?random=3',
        caption: 'Mountain view from my hike 🏔️'
      },
      {
        image_path: 'https://picsum.photos/800/800?random=4',
        caption: 'Coffee and coding ☕'
      },
      {
        image_path: 'https://picsum.photos/800/800?random=5',
        caption: 'New art exhibition 🎨'
      }
    ]

    for (const post of samplePosts) {
      await runQuery(
        'INSERT INTO posts (user_id, image_path, caption) VALUES (?, ?, ?)',
        [user.id, post.image_path, post.caption]
      )
    }

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    db.close()
  }
}

seedDatabase() 