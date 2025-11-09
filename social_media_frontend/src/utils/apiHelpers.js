// src/utils/apiHelpers.js

/**
 * Safely extract posts array from API response
 * Handles multiple response formats
 */
export const extractPostsArray = (apiResponse) => {
  if (!apiResponse) return [];
  
  let postsData = apiResponse;
  
  // If response has data property
  if (apiResponse.data !== undefined) {
    postsData = apiResponse.data;
  }
  
  // Handle different API response formats
  if (Array.isArray(postsData)) {
    return postsData;
  } else if (postsData && typeof postsData === 'object') {
    // DRF pagination format
    if (Array.isArray(postsData.results)) {
      return postsData.results;
    }
    // Custom posts format
    if (Array.isArray(postsData.posts)) {
      return postsData.posts;
    }
    // Data array format
    if (Array.isArray(postsData.data)) {
      return postsData.data;
    }
  }
  
  console.warn('Unexpected API response format. Expected array, got:', typeof postsData, postsData);
  return [];
};

/**
 * Safely filter posts with array check
 */
export const safeFilterPosts = (posts, searchQuery) => {
  if (!Array.isArray(posts)) return [];
  if (!searchQuery) return posts;
  
  const query = searchQuery.toLowerCase();
  return posts.filter(post => 
    post.content?.toLowerCase().includes(query) ||
    post.user_name?.toLowerCase().includes(query)
  );
};