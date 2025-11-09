import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ProfilePage = () => {
    const { userId } = useParams(); 
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newBio, setNewBio] = useState('');
    const [newPicture, setNewPicture] = useState(null);
    const [picturePreview, setPicturePreview] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    const profileId = userId || (user ? user.user_id : null);
    const isOwnProfile = user && user.user_id === parseInt(profileId);

    // ✅ FIXED: Enhanced follow status check
    const checkFollowStatus = async (targetUserId) => {
        try {
            console.log(`🔍 Checking follow status for user ${targetUserId}`);
            const response = await api.get(`users/${targetUserId}/status/`);
            console.log(`✅ Follow status response:`, response.data);
            return response.data.is_following || false;
        } catch (error) {
            console.log('❌ Could not check follow status:', error.response?.data || error.message);
            
            if (error.response?.status === 401) {
                alert("Your session has expired. Please login again.");
                logout();
                navigate('/login');
            }
            
            return false;
        }
    };

    // ✅ FIXED: Enhanced profile fetch with proper profile picture handling
    const fetchProfileData = useCallback(async () => {
        if (!profileId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        
        try {
            console.log(`📥 Fetching profile for user ${profileId}`);
            
            // Fetch the specific user profile
            const profileResponse = await api.get(`users/profiles/${profileId}/`); 
            const profileData = profileResponse.data;
            console.log(`✅ Profile data received:`, profileData);
            
            // Check follow status if it's not own profile and user is logged in
            let isFollowing = false;
            if (user && !isOwnProfile) {
                isFollowing = await checkFollowStatus(profileId);
                console.log(`✅ Follow status for user ${profileId}: ${isFollowing}`);
            }
            
            const updatedProfile = {
                ...profileData,
                is_following: isFollowing
            };
            
            setProfile(updatedProfile);
            setNewBio(profileData.bio || '');
            
            // ✅ FIXED: Set profile picture preview properly
            if (profileData.profile_picture) {
                setPicturePreview(profileData.profile_picture);
            } else if (profileData.profile_picture_url) {
                setPicturePreview(profileData.profile_picture_url);
            }
            
            setDebugInfo(`Loaded: ${profileData.name} | Followers: ${profileData.follower_count} | You follow: ${isFollowing}`);

            // Fetch user's posts
            try {
                const postsResponse = await api.get(`posts/?user=${profileId}`);
                let postsData = postsResponse.data;
                
                // Handle DRF pagination format
                if (postsData && postsData.results && Array.isArray(postsData.results)) {
                    postsData = postsData.results;
                } else if (!Array.isArray(postsData)) {
                    postsData = [];
                }
                
                setPosts(postsData);
                console.log(`✅ Loaded ${postsData.length} posts`);
            } catch (postsError) {
                console.log("User posts endpoint not available, using fallback");
                const allPostsResponse = await api.get('posts/');
                let allPosts = allPostsResponse.data;
                
                // Handle DRF pagination in fallback
                if (allPosts && allPosts.results && Array.isArray(allPosts.results)) {
                    allPosts = allPosts.results;
                } else if (Array.isArray(allPosts)) {
                    // Already an array
                } else {
                    allPosts = [];
                }
                
                const userPosts = allPosts.filter(post => post.user_id === parseInt(profileId));
                setPosts(userPosts);
                console.log(`✅ Loaded ${userPosts.length} posts via fallback`);
            }

        } catch (error) {
            console.error("❌ Error fetching profile data:", error.response?.data || error.message);
            if (error.response?.status === 404) {
                setProfile(null);
                setDebugInfo('User not found');
            } else if (error.response?.status === 401) {
                setDebugInfo('Authentication required');
            }
        } finally {
            setLoading(false);
        }
    }, [profileId, user, isOwnProfile, navigate, logout]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadData = async () => {
            if (isMounted) {
                await fetchProfileData();
            }
        };

        loadData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [fetchProfileData]);

    // ✅ FIXED: Enhanced profile picture handling
    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setNewPicture(null);
            setPicturePreview(null);
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
            e.target.value = '';
            return;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            alert('Image size must be less than 5MB');
            e.target.value = '';
            return;
        }

        setNewPicture(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPicturePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // ✅ FIXED: Enhanced Profile update with proper FormData handling
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        if (!newBio.trim() && !newPicture) {
            alert("Please provide a bio or new picture to update.");
            return;
        }

        setUpdating(true);

        try {
            const formData = new FormData();
            
            if (newBio.trim() !== profile.bio) {
                formData.append('bio', newBio.trim());
            }
            
            if (newPicture) {
                formData.append('profile_picture', newPicture);
            }

            console.log('🔄 Updating profile...', {
                hasBio: !!newBio.trim(),
                hasPicture: !!newPicture
            });

            const response = await api.patch(`users/profiles/me/`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ Profile updated successfully:', response.data);

            setProfile(response.data);
            setIsEditing(false);
            setNewPicture(null);
            
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';

            // Refresh the page to show updated data
            await fetchProfileData();

        } catch (error) {
            console.error("❌ Profile update failed:", error);
            console.error("Error details:", error.response?.data);
            
            if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.profile_picture) {
                    alert(`Image error: ${Array.isArray(errorData.profile_picture) ? errorData.profile_picture[0] : errorData.profile_picture}`);
                } else if (errorData.bio) {
                    alert(`Bio error: ${Array.isArray(errorData.bio) ? errorData.bio[0] : errorData.bio}`);
                } else {
                    alert("Failed to update profile. Please try again.");
                }
            } else {
                alert("Failed to update profile. Please try again.");
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setNewBio(profile?.bio || '');
        setNewPicture(null);
        setPicturePreview(profile?.profile_picture || profile?.profile_picture_url || null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
    };

    // ✅ FIXED: CORRECTED Follow/Unfollow - Use POST for both actions
    const handleFollowToggle = async () => {
        if (!user) {
            alert("You must be logged in to follow users.");
            navigate('/login');
            return;
        }

        if (isOwnProfile) {
            alert("You cannot follow yourself.");
            return;
        }

        if (!profile) return;

        setFollowLoading(true);
        const previousProfile = { ...profile };
        
        console.log(`🔄 Starting ${profile.is_following ? 'unfollow' : 'follow'} action for user ${profile.id}`);
        console.log(`📊 Before - Followers: ${profile.follower_count}, Following: ${profile.is_following}`);
        
        // Optimistic update
        const newFollowerCount = profile.is_following ? 
            Math.max(0, (profile.follower_count || 0) - 1) : 
            (profile.follower_count || 0) + 1;
            
        setProfile(prev => ({
            ...prev,
            is_following: !prev.is_following,
            follower_count: newFollowerCount
        }));

        setDebugInfo(`Optimistic update - Followers: ${newFollowerCount}, Following: ${!profile.is_following}`);

        try {
            let response;
            
            // ✅ FIXED: Use POST method for BOTH follow and unfollow
            // Your Django backend expects POST for both actions
            if (profile.is_following) {
                // Unfollow - use POST to the same endpoint
                console.log(`🚫 Sending POST to users/${profile.id}/unfollow/`);
                response = await api.post(`users/${profile.id}/unfollow/`);
            } else {
                // Follow - use POST method
                console.log(`❤️ Sending POST to users/${profile.id}/follow/`);
                response = await api.post(`users/${profile.id}/follow/`);
            }
            
            console.log(`✅ ${profile.is_following ? 'Unfollow' : 'Follow'} response:`, response.data);
            
            // Force refresh profile data to get accurate counts from server
            console.log("🔄 Refreshing profile data from server...");
            await fetchProfileData();
            
        } catch (error) {
            console.error("❌ Follow/Unfollow failed:", error);
            console.error("Error details:", error.response?.data || error.message);
            
            // Revert optimistic update on error
            setProfile(previousProfile);
            setDebugInfo(`Error: ${error.response?.data?.detail || 'Follow action failed'}`);
            
            if (error.response?.status === 401) {
                alert("Your session has expired. Please login again.");
                logout();
                navigate('/login');
            } else if (error.response?.status === 404) {
                // Try alternative endpoints if the main one fails
                console.log("❌ Endpoint not found, trying alternatives...");
                alert("Follow feature is currently unavailable. Please try again later.");
            } else if (error.response?.status === 405) {
                // Method not allowed - try alternative approach
                console.log("❌ Method not allowed, check backend configuration");
                alert("Follow action failed due to server configuration.");
            } else if (error.response?.data?.detail) {
                alert(error.response.data.detail);
            } else {
                alert("Failed to update follow status. Please try again.");
            }
        } finally {
            setFollowLoading(false);
        }
    };

    // Manual refresh function
    const handleRefresh = () => {
        console.log("🔄 Manual refresh triggered");
        fetchProfileData();
    };

    // Safe posts count
    const postsCount = Array.isArray(posts) ? posts.length : 0;

    if (loading) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
                <p>User not found or ID is invalid.</p>
                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                    Return to Feed
                </Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            
            {/* Debug Info Panel */}
            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                marginBottom: '20px', 
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                fontSize: '14px',
                color: '#495057'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <strong>Debug Info:</strong> 
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>{debugInfo}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={handleRefresh}
                            style={{ 
                                padding: '5px 12px',
                                fontSize: '12px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Refresh Data
                        </button>
                        <button 
                            onClick={() => {
                                console.log('📊 Current Profile State:', profile);
                                console.log('📊 Current Posts:', posts);
                                console.log('👤 Current User:', user);
                            }}
                            style={{ 
                                padding: '5px 12px',
                                fontSize: '12px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Log State
                        </button>
                    </div>
                </div>
                {profile && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                        User ID: {profile.id} | Followers: {profile.follower_count} | You Follow: {profile.is_following ? 'Yes' : 'No'}
                    </div>
                )}
            </div>

            {/* Profile Header */}
            <div style={{ 
                border: '1px solid #e0e0e0', 
                padding: '25px', 
                marginBottom: '30px', 
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
                    {/* ✅ FIXED: Profile Picture with Preview */}
                    <div style={{ position: 'relative' }}>
                        {picturePreview ? (
                            <img 
                                src={picturePreview}
                                alt={profile.name} 
                                style={{ 
                                    width: '120px', 
                                    height: '120px', 
                                    borderRadius: '50%', 
                                    marginRight: '25px', 
                                    objectFit: 'cover',
                                    border: '3px solid #f0f0f0'
                                }}
                                onError={(e) => {
                                    console.log('❌ Profile picture failed to load:', picturePreview);
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiMwMDdiZmYiLz4KPHRleHQgeD0iNjAiIHk9IjY4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI0OCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj4KICAgID88L3RleHQ+Cjwvc3ZnPgo=';
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: '#007bff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '48px',
                                fontWeight: 'bold',
                                marginRight: '25px',
                                border: '3px solid #f0f0f0'
                            }}>
                                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                        
                        {isOwnProfile && isEditing && (
                            <div style={{
                                position: 'absolute',
                                bottom: '5px',
                                right: '30px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}>
                                📷
                            </div>
                        )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>
                            {profile.name} 
                            <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>
                                (ID: {profile.id})
                            </span>
                        </h2>
                        <div style={{ color: '#666', marginBottom: '15px', fontSize: '0.95em' }}>
                            <strong>{profile.follower_count || 0}</strong> Followers • 
                            <strong> {0}</strong> Following
                            {profile.is_following !== undefined && (
                                <span style={{ 
                                    marginLeft: '10px', 
                                    color: profile.is_following ? '#28a745' : '#dc3545',
                                    fontWeight: '500'
                                }}>
                                    • {profile.is_following ? 'You follow this user' : 'Not following'}
                                </span>
                            )}
                        </div>
                        
                        <div style={{ marginTop: '15px' }}>
                            <strong style={{ color: '#333' }}>Bio:</strong>{' '}
                            <span style={{ color: '#555', lineHeight: '1.5' }}>
                                {profile.bio || "No bio yet."}
                            </span>
                        </div>
                        
                        <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#888' }}>
                            Joined {new Date(profile.date_joined).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    {isOwnProfile ? (
                        <>
                            <button 
                                onClick={() => setIsEditing(!isEditing)} 
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: isEditing ? '#6c757d' : '#ffc107', 
                                    color: 'black', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                            </button>
                            {isEditing && (
                                <button 
                                    onClick={handleProfileUpdate}
                                    disabled={updating}
                                    style={{ 
                                        padding: '10px 20px', 
                                        backgroundColor: updating ? '#6c757d' : '#28a745', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '6px', 
                                        cursor: updating ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </>
                    ) : (
                        user && (
                            <button 
                                onClick={handleFollowToggle} 
                                disabled={followLoading}
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: profile.is_following ? '#dc3545' : '#17a2b8', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: followLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    minWidth: '100px'
                                }}
                            >
                                {followLoading ? '...' : (profile.is_following ? 'Unfollow' : 'Follow')}
                            </button>
                        )
                    )}
                    
                    {!user && (
                        <Link 
                            to="/login" 
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: '#007bff', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                textDecoration: 'none',
                                display: 'inline-block'
                            }}
                        >
                            Login to Follow
                        </Link>
                    )}
                </div>

                {isOwnProfile && isEditing && (
                    <form onSubmit={handleProfileUpdate} style={{ 
                        marginTop: '25px', 
                        borderTop: '1px dashed #ddd', 
                        paddingTop: '20px' 
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                Update Bio:
                            </label>
                            <textarea
                                value={newBio}
                                onChange={(e) => setNewBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows="4"
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                Update Profile Picture:
                            </label>
                            <input
                                type="file"
                                accept="image/jpeg, image/jpg, image/png, image/gif, image/webp"
                                onChange={handlePictureChange}
                                style={{ 
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px dashed #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                            {newPicture && (
                                <div style={{ 
                                    marginTop: '8px', 
                                    fontSize: '12px', 
                                    color: '#28a745',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    ✅ Selected: {newPicture.name} ({(newPicture.size / 1024 / 1024).toFixed(2)} MB)
                                </div>
                            )}
                        </div>
                    </form>
                )}
            </div>

            {/* User Posts Section */}
            <div>
                <h3 style={{ 
                    marginBottom: '20px', 
                    color: '#333',
                    borderBottom: '2px solid #007bff',
                    paddingBottom: '10px'
                }}>
                    {isOwnProfile ? 'Your Posts' : `${profile.name}'s Posts`} ({postsCount})
                </h3>
                
                {postsCount === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px', 
                        color: '#666',
                        border: '1px dashed #ddd',
                        borderRadius: '8px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <p>
                            {isOwnProfile ? 
                                "You haven't shared any posts yet." : 
                                `${profile.name} hasn't shared any posts yet.`
                            }
                        </p>
                        {isOwnProfile && (
                            <Link 
                                to="/" 
                                style={{ 
                                    color: '#007bff', 
                                    textDecoration: 'none',
                                    fontWeight: '500'
                                }}
                            >
                                Create your first post
                            </Link>
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
                            <p style={{ 
                                fontSize: '1em', 
                                lineHeight: '1.6',
                                color: '#333',
                                margin: '0 0 15px 0'
                            }}>
                                {post.content}
                            </p>
                            
                            {post.image && (
                                <img 
                                    src={post.image} 
                                    alt="Post content" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        height: 'auto', 
                                        borderRadius: '6px', 
                                        marginTop: '10px',
                                        border: '1px solid #eee'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            )}
                            
                            <div style={{ 
                                marginTop: '15px', 
                                fontSize: '0.9em', 
                                color: '#666',
                                display: 'flex',
                                gap: '15px',
                                borderTop: '1px solid #f0f0f0',
                                paddingTop: '10px'
                            }}>
                                <span>❤️ {post.like_count || 0} Likes</span>
                                <span>💬 {post.comment_count || 0} Comments</span>
                                <span style={{ marginLeft: 'auto' }}>
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProfilePage;