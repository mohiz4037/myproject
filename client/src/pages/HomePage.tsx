
import React from 'react';
import { PostList } from '@/components/PostList';

export function HomePage() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Campus Connect</h1>
      <PostList />
    </div>
  );
}

export default HomePage;
