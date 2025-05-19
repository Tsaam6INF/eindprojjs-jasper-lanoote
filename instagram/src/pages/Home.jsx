import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ image: null, caption: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/posts", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const data = await response.json();
      setPosts(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, image: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.image) return;

    const formData = new FormData();
    formData.append("image", newPost.image);
    formData.append("caption", newPost.caption);

    try {
      const response = await fetch("http://localhost:3000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setNewPost({ image: null, caption: "" });
        fetchPosts();
      }
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home">
      {user && (
        <div className="create-post">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Write a caption..."
                value={newPost.caption}
                onChange={(e) =>
                  setNewPost({ ...newPost, caption: e.target.value })
                }
              />
            </div>
            <button type="submit" className="post-button">
              Share
            </button>
          </form>
        </div>
      )}

      <div className="posts">
        {posts.map((post) => (
          <div key={post.id} className="post">
            <div className="post-header">
              <Link to={`/profile/${post.username}`} className="post-username">
                {post.username}
              </Link>
            </div>
            <div className="post-image">
              <img src={post.image_path} alt={post.caption} />
            </div>
            <div className="post-actions">
              <button
                onClick={() => handleLike(post.id)}
                className={`like-button ${post.liked ? "liked" : ""}`}
                disabled={!user}
              >
                ❤️ {post.likes_count}
              </button>
            </div>
            <div className="post-caption">
              <Link to={`/profile/${post.username}`} className="post-username">
                {post.username}
              </Link>{" "}
              {post.caption}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
