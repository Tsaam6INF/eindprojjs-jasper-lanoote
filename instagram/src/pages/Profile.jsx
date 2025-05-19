import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./Profile.css";

function Profile({ user }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/users/${username}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      const data = await response.json();
      setProfile(data);
      setPosts(data.posts);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!profile) {
    return <div className="error">Profile not found</div>;
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-info">
          <h1>{profile.username}</h1>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">posts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-posts">
        {posts.length === 0 ? (
          <div className="no-posts">No posts yet</div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="post-thumbnail">
                <img src={post.image_path} alt={post.caption} />
                <div className="post-overlay">
                  <div className="post-stats">
                    <span>❤️ {post.likes_count}</span>
                    <span>💬 {post.comments_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
