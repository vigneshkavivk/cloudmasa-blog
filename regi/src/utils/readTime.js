// src/utils/readTime.js

export const getReadTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes === 1 ? "1 min read" : `${minutes} min read`;
};