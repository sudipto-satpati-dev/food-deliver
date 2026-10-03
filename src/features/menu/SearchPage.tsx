import React from 'react'

export const SearchPage: React.FC = () => (
  <div className="space-y-4">
    <h2 className="font-heading text-xl font-bold">Search</h2>
    <input type="text" placeholder="Search biryani, pizza, burger..." className="w-full p-3 rounded-btn border border-brand-border text-sm" />
  </div>
)
