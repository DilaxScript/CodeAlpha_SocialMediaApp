import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';
import SearchBar from '../components/SearchBar';

// Enhanced CommentForm component
const CommentForm = ({ postId, onCommentAdded }) => {
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user || !commentText.trim()) return;

        setSubmitting(true);
        try {
            console.log('🔄 Posting comment to post:', postId);
            
            // FIXED: Use 'text' field instead of 'content'
            const response = await api.post(`posts/${postId}/comment/`, { 
                text: commentText.trim()  // Changed from 'content' to 'text'
            });
            
            console.log('✅ Comment posted successfully:', response.data);
            
            setCommentText('');
            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (error) {
            console.error("❌ Failed to add comment:", error.response?.data || error.message);
            
            // Show specific error messages
            if (error.response?.data?.text) {
                alert(`Comment error: ${Array.isArray(error.response.data.text) ? error.response.data.text[0] : error.response.data.text}`);
            } else if (error.response?.data?.detail) {
                alert(`Error: ${error.response.data.detail}`);
            } else {
                alert("Failed to add comment. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', marginTop: '10px', alignItems: 'center' }}>
            <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                required
                disabled={submitting}
                style={{ 
                    flexGrow: 1, 
                    marginRight: '10px',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    fontSize: '14px',
                    outline: 'none'
                }} 
            />
            <button 
                type="submit" 
                disabled={submitting || !commentText.trim()}
                style={{ 
                    padding: '8px 16px', 
                    backgroundColor: submitting || !commentText.trim() ? '#ccc' : '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '20px', 
                    cursor: submitting || !commentText.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                }}
            >
                {submitting ? '...' : 'Post'}
            </button>
        </form>
    );
};

// Comments display component - SIMPLIFIED since comment listing endpoints don't exist
const CommentsSection = ({ postId, commentCount, onCommentAdded }) => {
    const [showComments, setShowComments] = useState(false);
    const { user } = useAuth();

    const toggleComments = () => {
        setShowComments(!showComments);
    };

    const handleCommentAdded = () => {
        if (onCommentAdded) {
            onCommentAdded();
        }
    };

    return (
        <div style={{ marginTop: '15px' }}>
            <button 
                onClick={toggleComments}
                style={{ 
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 0'
                }}
            >
                💬 {commentCount || 0} Comments
                <span style={{ fontSize: '12px' }}>
                    {showComments ? '▲' : '▼'}
                </span>
            </button>

            {showComments && (
                <div style={{ marginTop: '10px' }}>
                    {/* Add comment form */}
                    {user && (
                        <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
                    )}

                    {/* Comments list - Simplified since we can't fetch comments */}
                    <div style={{ marginTop: '15px' }}>
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontStyle: 'italic' }}>
                            {commentCount > 0 
                                ? `${commentCount} comment(s) - Comments will appear after page refresh` 
                                : 'No comments yet. Be the first to comment!'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeedPage = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Fetch posts
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔄 Fetching posts...');
            const response = await api.get('posts/'); 
            
            let postsData = response.data;
            
            // Handle Django REST Framework pagination format
            if (postsData && postsData.results && Array.isArray(postsData.results)) {
                postsData = postsData.results;
            }
            else if (Array.isArray(postsData)) {
                // Already correct format
            }
            else {
                console.warn('Unexpected API response format:', postsData);
                postsData = [];
                setError('Unexpected data format received from server.');
            }
            
            console.log('✅ Posts loaded:', postsData.length);
            setPosts(postsData);
            
        } catch (error) {
            console.error("❌ Error fetching feed:", error);
            setError("Failed to load posts. Please try again.");
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        
        if (!user) {
            alert("You must be logged in to post.");
            return;
        }

        // TEMPORARY: Only allow text posts until image upload is fixed
        if (!newPostContent.trim()) {
            alert("Post must contain text.");
            return;
        }

        setSubmitting(true);

        try {
            console.log('🔄 Creating text-only post...');
            
            // TEMPORARY: Create text-only post (more reliable)
            const response = await api.post('posts/', {
                content: newPostContent.trim()
            });

            console.log('✅ Post created successfully:', response.data);

            // Reset form
            setNewPostContent('');
            setNewPostImage(null);
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
            
            // Refresh posts
            await fetchPosts();
            
        } catch (error) {
            console.error("❌ Failed to create post:", error);
            console.error("Error details:", error.response?.data);
            
            // Show specific error message
            if (error.response?.data) {
                const errorData = error.response.data;
                
                if (errorData.content) {
                    alert(`Content error: ${Array.isArray(errorData.content) ? errorData.content[0] : errorData.content}`);
                } else if (errorData.detail) {
                    alert(`Error: ${errorData.detail}`);
                } else {
                    alert("Failed to create post. Please try again.");
                }
            } else {
                alert("Failed to create post. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleLikeToggle = async (postId) => {
        if (!user) {
            alert("You must be logged in to like posts.");
            return;
        }

        try {
            console.log('🔄 Toggling like for post:', postId);
            await api.post(`posts/${postId}/toggle_like/`);
            
            // Update local state optimistically
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { 
                            ...post, 
                            like_count: post.is_liked ? (post.like_count || 0) - 1 : (post.like_count || 0) + 1,
                            is_liked: !post.is_liked 
                        } 
                        : post
                )
            );
            console.log('✅ Like toggled successfully');
        } catch (error) {
            console.error("❌ Like toggle failed:", error.response?.data || error.message);
            // Refresh posts to get correct state
            await fetchPosts();
        }
    };

    const handleCommentAdded = (postId) => {
        // Update comment count optimistically when a comment is added
        setPosts(prevPosts => 
            prevPosts.map(post => 
                post.id === postId 
                    ? { 
                        ...post, 
                        comment_count: (post.comment_count || 0) + 1
                    } 
                    : post
            )
        );
        
        // Refresh posts after a short delay to get actual count
        setTimeout(() => {
            fetchPosts();
        }, 1000);
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return 'Invalid date';
        }
    };

    if (loading) {
        return (
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
                <p>Loading feed...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#dc3545' }}>{error}</p>
                <button 
                    onClick={fetchPosts}
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        marginTop: '10px'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}> 
            
            <SearchBar />

            <h2 style={{ marginBottom: '20px', color: '#333' }}>Global Feed</h2>
            
            {user && (
                <div style={{ 
                    border: '1px solid #e0e0e0', 
                    padding: '20px', 
                    marginBottom: '25px', 
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>Create New Post</h3>
                    <form onSubmit={handlePostSubmit}>
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="What's on your mind?"
                            rows="3"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                resize: 'vertical',
                                marginBottom: '15px',
                                fontFamily: 'inherit'
                            }}
                        />
                        
                        {/* TEMPORARILY DISABLED IMAGE UPLOAD */}
                        <div style={{ 
                            marginBottom: '15px', 
                            padding: '10px',
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: '#856404'
                        }}>
                            📷 Image upload temporarily disabled. Text-only posts work perfectly!
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={submitting || !newPostContent.trim()}
                            style={{ 
                                padding: '10px 20px',
                                backgroundColor: submitting ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            {submitting ? 'Posting...' : 'Post'}
                        </button>
                        
                        {!newPostContent.trim() && (
                            <div style={{ 
                                marginTop: '10px', 
                                fontSize: '12px', 
                                color: '#dc3545' 
                            }}>
                                Please add some text to post.
                            </div>
                        )}
                    </form>
                </div>
            )}

            {posts.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: '#666',
                    border: '1px dashed #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <p>No posts in your feed yet. Start following users or create a post!</p>
                    {!user && (
                        <p style={{ marginTop: '10px' }}>
                            <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
                                Login to create posts
                            </Link>
                        </p>
                    )}
                </div>
            ) : (
                posts.map(post => (
                    <div key={post.id} style={{ 
                        border: '1px solid #e0e0e0', 
                        padding: '20px', 
                        marginBottom: '20px', 
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontWeight: '500', color: '#333' }}>
                                Posted by: <Link to={`/profile/${post.user_id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                                    {post.user_name}
                                </Link>
                            </span>
                            <span style={{ float: 'right', fontSize: '0.8em', color: '#666' }}>
                                {formatDate(post.created_at)}
                            </span>
                        </div>
                        
                        {post.content && (
                            <p style={{ 
                                marginTop: '10px', 
                                marginBottom: '15px', 
                                fontSize: '1em', 
                                lineHeight: '1.5',
                                color: '#333',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {post.content}
                            </p>
                        )}

                        {post.image && (
                            <img 
                                src={post.image} 
                                alt="Post content" 
                                style={{ 
                                    maxWidth: '100%', 
                                    height: 'auto', 
                                    borderRadius: '4px', 
                                    marginBottom: '15px',
                                    border: '1px solid #eee'
                                }}
                                onError={(e) => {
                                    console.log('❌ Image failed to load:', post.image);
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginTop: '15px', 
                            borderTop: '1px solid #eee', 
                            paddingTop: '15px' 
                        }}>
                            <button 
                                onClick={() => handleLikeToggle(post.id)}
                                style={{ 
                                    padding: '8px 16px', 
                                    backgroundColor: post.is_liked ? '#dc3545' : '#6c757d', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {post.is_liked ? '❤️' : '🤍'} Like ({post.like_count || 0})
                            </button>
                        </div>

                        {/* Comments Section */}
                        <CommentsSection 
                            postId={post.id} 
                            commentCount={post.comment_count || 0}
                            onCommentAdded={() => handleCommentAdded(post.id)}
                        />
                    </div>
                ))
            )}
        </div>
    );
};

export default FeedPage;