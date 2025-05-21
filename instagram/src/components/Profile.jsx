import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/users/${username}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      setUser(data);
      setPosts(data.posts);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Error loading profile");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Maximum size is 5MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("caption", newPostCaption);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to create a post");
      }

      const response = await fetch("http://localhost:3000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error creating post");
      }

      setPosts((prevPosts) => [data, ...prevPosts]);
      setNewPostCaption("");
      setSelectedFile(null);
      setShowNewPostForm(false);
    } catch (error) {
      console.error("Error creating post:", error);
      alert(error.message || "Error creating post. Please try again.");
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

      // Update the posts state to reflect the like
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

  if (!user) {
    return <div>Loading...</div>;
  }

  const isOwnProfile =
    user.username === JSON.parse(localStorage.getItem("user"))?.username;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <h2>{user.username}</h2>
          <div className="profile-stats">
            <span>{posts.length} posts</span>
          </div>
        </div>
        {isOwnProfile && (
          <button
            className="new-post-button"
            onClick={() => setShowNewPostForm(true)}
          >
            New Post
          </button>
        )}
      </div>

      {showNewPostForm && isOwnProfile && (
        <div className="new-post-form">
          <h3>Create New Post</h3>
          <form onSubmit={handlePostSubmit}>
            <div className="form-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Write a caption..."
                value={newPostCaption}
                onChange={(e) => setNewPostCaption(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button type="submit">Post</button>
              <button type="button" onClick={() => setShowNewPostForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="posts-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <img
              src={`http://localhost:3000${post.image_path}`}
              alt={post.caption}
              style={{ maxWidth: "100%", height: "auto" }}
            />
            <div className="post-info">
              <p className="post-caption">{post.caption}</p>
              <div className="post-actions">
                <button
                  className={`like-button ${post.liked ? "liked" : ""}`}
                  onClick={() => handleLike(post.id)}
                >
                  ❤️ {post.likes_count}
                </button>
                <span className="comments-count">💬 {post.comments_count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
