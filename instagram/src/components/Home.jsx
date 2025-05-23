import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      setLoading(false);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Error loading posts");
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/posts/${postId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      setComments((prevComments) => ({ ...prevComments, [postId]: data }));
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  useEffect(() => {
    posts.forEach((post) => {
      fetchComments(post.id);
    });
  }, [posts]);

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

  const handleAddComment = async (postId, text) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error("Error adding comment");
      }

      const newComment = await response.json();
      setComments((prevComments) => ({
        ...prevComments,
        [postId]: [...(prevComments[postId] || []), newComment],
      }));
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleUsernameClick = (username) => {
    navigate(`/profile/${username}`);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-container">
      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : (
        <div className="posts-feed">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div
                  className="post-user-info"
                  onClick={() => handleUsernameClick(post.username)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="post-username">{post.username}</span>
                </div>
              </div>
              <img
                src={`http://localhost:3000${post.image_path}`}
                alt={post.caption}
                className="post-image"
              />
              <div className="post-info">
                <div className="post-actions">
                  <button
                    className={`like-button ${post.liked ? "liked" : ""}`}
                    onClick={() => handleLike(post.id)}
                  >
                    ❤️{" "}
                    <span style={{ color: "black" }}>{post.likes_count}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)}>
                    💬{" "}
                    <span style={{ color: "black" }}>
                      {post.comments_count}
                    </span>
                  </button>
                </div>
                <p className="post-caption">
                  <span className="post-username">{post.username}</span>{" "}
                  {post.caption}
                </p>
                {showComments[post.id] && (
                  <div className="comments-section">
                    {comments[post.id]?.map((comment) => (
                      <p
                        key={comment.id}
                        className="comment"
                        style={{ color: "black", margin: "5px 0" }}
                      >
                        <span
                          className="comment-username"
                          style={{ fontWeight: "bold" }}
                        >
                          {comment.username}
                        </span>{" "}
                        {comment.text}
                      </p>
                    ))}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const text = e.target.comment.value;
                        if (text) {
                          handleAddComment(post.id, text);
                          e.target.comment.value = "";
                        }
                      }}
                    >
                      <input
                        type="text"
                        name="comment"
                        placeholder="Add a comment..."
                        style={{
                          width: "100%",
                          padding: "5px",
                          marginTop: "10px",
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          marginTop: "5px",
                          padding: "5px 10px",
                          backgroundColor: "#0095f6",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                        }}
                      >
                        Post
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
