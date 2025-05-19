import { useState, useEffect } from "react";
import "./Home.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/posts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Error loading posts");
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error liking post");
      }

      setPosts(
        posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              liked: !post.liked,
              likes_count: post.liked
                ? post.likes_count - 1
                : post.likes_count + 1,
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-container">
      <div className="posts-feed">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <span className="post-username">{post.username}</span>
            </div>
            <img src={post.image_path} alt={post.caption} />
            <div className="post-info">
              <div className="post-actions">
                <button
                  className={`like-button ${post.liked ? "liked" : ""}`}
                  onClick={() => handleLike(post.id)}
                >
                  ❤️ {post.likes_count}
                </button>
                <span className="comments-count">💬 {post.comments_count}</span>
              </div>
              <p className="post-caption">
                <span className="post-username">{post.username}</span>{" "}
                {post.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
