import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ users: [], posts: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResults, setShowResults] = useState(false);

    // ✅ FIXED: Handle your specific API format
    const extractUsersArray = (apiResponse) => {
        if (!apiResponse) return [];
        
        console.log('🔍 Raw users API response:', apiResponse);
        
        // Handle your specific format: 
        // {query: 'dilax', count: 4, results: {count: 2, results: [...]}}
        if (apiResponse && apiResponse.results) {
            // If results has nested results array
            if (apiResponse.results.results && Array.isArray(apiResponse.results.results)) {
                console.log('✅ Found nested results array:', apiResponse.results.results);
                return apiResponse.results.results;
            }
            // If results is directly an array
            else if (Array.isArray(apiResponse.results)) {
                console.log('✅ Found direct results array:', apiResponse.results);
                return apiResponse.results;
            }
        }
        
        // If it's already an array
        if (Array.isArray(apiResponse)) {
            return apiResponse;
        }
        
        console.warn('❌ Could not extract users from:', apiResponse);
        return [];
    };

    const extractPostsArray = (apiResponse) => {
        if (!apiResponse) return [];
        
        // Handle DRF pagination format: {count: X, results: [...]}
        if (apiResponse && apiResponse.results && Array.isArray(apiResponse.results)) {
            return apiResponse.results;
        }
        // If it's already an array
        else if (Array.isArray(apiResponse)) {
            return apiResponse;
        }
        
        return [];
    };

    const debouncedSearch = useCallback(
        (() => {
            let timeoutId;
            return (searchQuery) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(async () => {
                    if (searchQuery.trim()) {
                        await performSearch(searchQuery);
                    } else {
                        setResults({ users: [], posts: [] });
                        setShowResults(false);
                    }
                }, 400);
            };
        })(),
        []
    );

    useEffect(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]);

    const performSearch = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults({ users: [], posts: [] });
            setShowResults(false);
            return;
        }

        setLoading(true);
        setError('');
        setShowResults(true);

        try {
            let usersData = [];
            let postsData = [];

            // ✅ FIXED: Search for USERS
            console.log('🔍 Searching for users with query:', searchQuery);
            
            try {
                const userResponse = await api.get(`users/search/?q=${encodeURIComponent(searchQuery)}`);
                usersData = extractUsersArray(userResponse.data);
                console.log('✅ Users found:', usersData);
            } catch (userError) {
                console.log('❌ User search failed, trying profiles endpoint...');
                
                // Fallback: get all profiles and filter client-side
                try {
                    const allProfilesResponse = await api.get('users/profiles/');
                    const allProfiles = extractUsersArray(allProfilesResponse.data);
                    
                    const searchLower = searchQuery.toLowerCase();
                    usersData = allProfiles.filter(user => {
                        if (!user) return false;
                        
                        return (
                            (user.name && user.name.toLowerCase().includes(searchLower)) ||
                            (user.username && user.username.toLowerCase().includes(searchLower)) ||
                            (user.email && user.email.toLowerCase().includes(searchLower)) ||
                            (user.bio && user.bio.toLowerCase().includes(searchLower))
                        );
                    });
                    console.log('✅ Users found via profiles:', usersData);
                } catch (profilesError) {
                    console.log('❌ Profiles endpoint failed');
                    usersData = [];
                }
            }

            // ✅ FIXED: Search for POSTS
            console.log('🔍 Searching for posts with query:', searchQuery);
            
            try {
                const postsResponse = await api.get('posts/');
                const allPosts = extractPostsArray(postsResponse.data);
                
                const searchLower = searchQuery.toLowerCase();
                postsData = allPosts.filter(post => {
                    if (!post) return false;
                    
                    return (
                        (post.content && post.content.toLowerCase().includes(searchLower)) ||
                        (post.user_name && post.user_name.toLowerCase().includes(searchLower))
                    );
                });
                console.log('✅ Posts found:', postsData);
            } catch (postsError) {
                console.log('❌ Posts search failed:', postsError);
                postsData = [];
            }

            setResults({
                users: usersData,
                posts: postsData
            });

            console.log('🎯 Final search results:', {
                users: usersData.length,
                posts: postsData.length
            });

        } catch (error) {
            console.error("❌ Search failed:", error);
            setError("Search temporarily unavailable. Please try again.");
            setResults({ users: [], posts: [] });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (query.trim()) {
            await performSearch(query);
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        setError('');
    };

    const clearSearch = () => {
        setQuery('');
        setResults({ users: [], posts: [] });
        setShowResults(false);
        setError('');
    };

    const handleResultClick = () => {
        setShowResults(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.search-container')) {
                setShowResults(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // ✅ FIXED: Better user display functions
    const getUserDisplayName = (user) => {
        if (!user) return 'Unknown User';
        return user.name || user.username || user.email || 'Unknown User';
    };

    const getUserInitial = (user) => {
        const name = getUserDisplayName(user);
        return name.charAt(0).toUpperCase();
    };

    // ✅ FIXED: Get profile picture URL
    const getProfilePictureUrl = (user) => {
        if (!user) return null;
        return user.profile_picture_url || user.profile_picture;
    };

    return (
        <div className="search-container" style={{ 
            position: 'relative',
            marginBottom: '20px'
        }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flexGrow: 1 }}>
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="Search users by name, email or posts by content..."
                        style={{ 
                            width: '100%',
                            padding: '12px 16px',
                            paddingRight: '40px',
                            border: error ? '1px solid #dc3545' : '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '16px',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onFocus={() => query.trim() && setShowResults(true)}
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                fontSize: '18px',
                                cursor: 'pointer',
                                color: '#999',
                                padding: '4px'
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>
                <button 
                    type="submit" 
                    disabled={loading || !query.trim()}
                    style={{ 
                        padding: '12px 20px',
                        backgroundColor: loading ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '500'
                    }}
                >
                    {loading ? '...' : 'Search'}
                </button>
            </form>

            {error && (
                <div style={{ 
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    {error}
                </div>
            )}

            {showResults && (results.users.length > 0 || results.posts.length > 0 || loading) && (
                <div style={{ 
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    marginTop: '10px',
                    zIndex: 1000,
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    {loading ? (
                        <div style={{ 
                            padding: '20px', 
                            textAlign: 'center',
                            color: '#666'
                        }}>
                            <p>🔍 Searching for "{query}"...</p>
                        </div>
                    ) : (
                        <>
                            {/* User Results */}
                            {results.users.length > 0 && (
                                <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                                    <h5 style={{ 
                                        margin: '0 0 10px 0', 
                                        color: '#333',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}>
                                        👥 Users ({results.users.length})
                                    </h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {results.users.map(user => (
                                            <Link 
                                                key={user.id} 
                                                to={`/profile/${user.id}`}
                                                onClick={handleResultClick}
                                                style={{ 
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '10px',
                                                    textDecoration: 'none',
                                                    color: '#333',
                                                    borderRadius: '6px',
                                                    border: '1px solid transparent',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#f8f9fa';
                                                    e.target.style.borderColor = '#007bff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = 'transparent';
                                                    e.target.style.borderColor = 'transparent';
                                                }}
                                            >
                                                {getProfilePictureUrl(user) ? (
                                                    <img 
                                                        src={`http://127.0.0.1:8000${getProfilePictureUrl(user)}`}
                                                        alt={getUserDisplayName(user)}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            flexShrink: 0
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            // Show fallback avatar
                                                            const fallback = e.target.nextSibling;
                                                            if (fallback) fallback.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#007bff',
                                                    display: getProfilePictureUrl(user) ? 'none' : 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    flexShrink: 0
                                                }}>
                                                    {getUserInitial(user)}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ 
                                                        fontWeight: '500',
                                                        fontSize: '15px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {getUserDisplayName(user)}
                                                    </div>
                                                    {user.email && (
                                                        <div style={{ 
                                                            fontSize: '12px', 
                                                            color: '#666',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {user.email}
                                                        </div>
                                                    )}
                                                    {user.bio && (
                                                        <div style={{ 
                                                            fontSize: '12px', 
                                                            color: '#888',
                                                            marginTop: '2px',
                                                            fontStyle: 'italic',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {user.bio}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#28a745',
                                                    fontWeight: '500',
                                                    flexShrink: 0
                                                }}>
                                                    View →
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Post Results */}
                            {results.posts.length > 0 && (
                                <div style={{ padding: '15px' }}>
                                    <h5 style={{ 
                                        margin: '0 0 10px 0', 
                                        color: '#333',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}>
                                        📝 Posts ({results.posts.length})
                                    </h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {results.posts.map(post => (
                                            <div key={post.id}>
                                                <Link 
                                                    to={`/profile/${post.user_id}`}
                                                    onClick={handleResultClick}
                                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                                >
                                                    <div style={{ 
                                                        border: '1px solid #e9ecef',
                                                        padding: '12px',
                                                        borderRadius: '6px',
                                                        transition: 'all 0.2s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                        e.currentTarget.style.borderColor = '#007bff';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'white';
                                                        e.currentTarget.style.borderColor = '#e9ecef';
                                                    }}
                                                >
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <span style={{ 
                                                            fontWeight: '600', 
                                                            color: '#007bff',
                                                            fontSize: '14px'
                                                        }}>
                                                            👤 {post.user_name || 'Unknown User'}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '12px', 
                                                            color: '#666',
                                                            flexShrink: 0
                                                        }}>
                                                            {new Date(post.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p style={{ 
                                                        margin: 0,
                                                        fontSize: '14px',
                                                        lineHeight: '1.4',
                                                        color: '#333'
                                                    }}>
                                                        {post.content ? 
                                                            (post.content.length > 100 ? 
                                                                post.content.substring(0, 100) + '...' : 
                                                                post.content
                                                            ) : 
                                                            '📷 Image Post'
                                                        }
                                                    </p>
                                                    {post.image && (
                                                        <div style={{ 
                                                            marginTop: '8px',
                                                            fontSize: '12px',
                                                            color: '#666'
                                                        }}>
                                                            📎 Contains image
                                                        </div>
                                                    )}
                                                    <div style={{ 
                                                        display: 'flex',
                                                        gap: '15px',
                                                        marginTop: '8px',
                                                        fontSize: '12px',
                                                        color: '#666'
                                                    }}>
                                                        <span>❤️ {post.like_count || 0} Likes</span>
                                                        <span>💬 {post.comment_count || 0} Comments</span>
                                                    </div>
                                                </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!loading && results.users.length === 0 && results.posts.length === 0 && query.trim() && (
                        <div style={{ 
                            padding: '30px', 
                            textAlign: 'center',
                            color: '#666'
                        }}>
                            <p>No results found for "<strong>{query}</strong>"</p>
                            <p style={{ fontSize: '14px', marginTop: '8px' }}>
                                Try searching for user names, emails, or post content
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;