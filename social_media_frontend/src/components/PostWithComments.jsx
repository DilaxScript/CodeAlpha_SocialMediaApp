import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';

const PostWithComments = ({ post, onUpdate, showUserInfo = true }) => {
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    // Fetch comments for this post
    const fetchComments = async () => {
        if (!post.id) return;
        
        setLoading(true);
        try {
            let commentsData = [];
            
            // Try different comment endpoints
            try {
                // Try comments endpoint with post filter
                const response = await api.get(`comments/?post=${post.id}`);
                commentsData = response.data.results || response.data || [];
            } catch (error) {
                console.log('Comments endpoint failed, trying post detail:', error);
                
                // Try post detail endpoint
                try {
                    const postResponse = await api.get(`posts/${post.id}/`);
                    if (postResponse.data && postResponse.data.comments) {
                        commentsData = postResponse.data.comments;
                    }
                } catch (postError) {
                    console.log('Post detail endpoint also failed:', postError);
                }
            }
            
            setComments(commentsData);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle adding a new comment
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setCommentLoading(true);
        try {
            let response;
            
            // Try different comment creation endpoints
            try {
                // Try post comment endpoint
                response = await api.post(`posts/${post.id}/comment/`, {
                    content: newComment.trim()
                });
            } catch (error) {
                // Try comments endpoint
                response = await api.post('comments/', {
                    post: post.id,
                    content: newComment.trim()
                });
            }
            
            // Add new comment to the list
            const commentWithUser = {
                ...response.data,
                user_name: user.name || user.username,
                user_id: user.user_id,
                created_at: new Date().toISOString()
            };
            
            setComments(prev => [commentWithUser, ...prev]);
            setNewComment('');
            
            // Update post comment count
            if (onUpdate) {
                onUpdate({
                    ...post,
                    comment_count: (post.comment_count || 0) + 1
                });
            }
            
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        } finally {
            setCommentLoading(false);
        }
    };

    // Handle like toggle
    const handleLikeToggle = async () => {
        if (!user) {
            alert("You must be logged in to like posts.");
            return;
        }

        setLikeLoading(true);
        try {
            await api.post(`posts/${post.id}/toggle_like/`);
            
            // Update local state
            if (onUpdate) {
                onUpdate({
                    ...post,
                    like_count: post.is_liked ? (post.like_count || 0) - 1 : (post.like_count || 0) + 1,
                    is_liked: !post.is_liked
                });
            }
        } catch (error) {
            console.error("Like toggle failed:", error);
            alert("Failed to like post. Please try again.");
        } finally {
            setLikeLoading(false);
        }
    };

    // Toggle comments visibility
    const toggleComments = () => {
        if (!showComments) {
            fetchComments();
        }
        setShowComments(!showComments);
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <div style={{ 
            border: '1px solid #e0e0e0', 
            padding: '20px', 
            marginBottom: '20px', 
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            {/* Post Header */}
            {showUserInfo && (
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
            )}
            
            {/* Post Content */}
            {post.content && (
                <p style={{ 
                    marginBottom: '15px', 
                    fontSize: '1em', 
                    lineHeight: '1.5',
                    color: '#333'
                }}>
                    {post.content}
                </p>
            )}

            {/* Post Image */}
            {post.image && (
                <img 
                    src={post.image} 
                    alt="Post content" 
                    style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        borderRadius: '6px', 
                        marginBottom: '15px',
                        border: '1px solid #eee'
                    }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            )}
            
            {/* Post Actions */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderTop: '1px solid #eee', 
                paddingTop: '15px' 
            }}>
                <button 
                    onClick={handleLikeToggle}
                    disabled={likeLoading}
                    style={{ 
                        padding: '8px 16px', 
                        backgroundColor: post.is_liked ? '#dc3545' : '#6c757d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: likeLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    ❤️ {likeLoading ? '...' : `Like (${post.like_count || 0})`}
                </button>
                
                <button 
                    onClick={toggleComments}
                    style={{ 
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    💬 {post.comment_count || 0} Comments
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div style={{ marginTop: '15px' }}>
                    {/* Add Comment Form */}
                    {user && (
                        <form onSubmit={handleAddComment} style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    style={{ 
                                        flex: 1,
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                    disabled={commentLoading}
                                />
                                <button 
                                    type="submit"
                                    disabled={!newComment.trim() || commentLoading}
                                    style={{ 
                                        padding: '10px 20px',
                                        backgroundColor: !newComment.trim() || commentLoading ? '#ccc' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '20px',
                                        cursor: !newComment.trim() || commentLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {commentLoading ? '...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Comments List */}
                    <div>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                Loading comments...
                            </div>
                        ) : comments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontStyle: 'italic' }}>
                                No comments yet. {user ? 'Be the first to comment!' : 'Login to comment.'}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {comments.map(comment => (
                                    <div key={comment.id} style={{ 
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                                                {comment.user_name || 'Unknown User'}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#666' }}>
                                                {formatDate(comment.created_at)}
                                            </span>
                                        </div>
                                        <p style={{ 
                                            margin: 0, 
                                            fontSize: '14px', 
                                            lineHeight: '1.4',
                                            color: '#495057'
                                        }}>
                                            {comment.content || comment.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostWithComments;