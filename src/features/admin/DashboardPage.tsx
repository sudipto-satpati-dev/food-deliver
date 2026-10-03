import React from 'react'

export const DashboardPage: React.FC = () => (
  <div className="space-y-4">
    <h2 className="font-heading text-2xl font-bold">Admin Dashboard</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-card border border-gray-200 shadow-subtle">
        <span className="text-xs text-gray-500 font-medium">Today's Orders</span>
        <p className="text-2xl font-bold text-brand-primary">12</p>
      </div>
      <div className="bg-white p-4 rounded-card border border-gray-200 shadow-subtle">
        <span className="text-xs text-gray-500 font-medium">Revenue</span>
        <p className="text-2xl font-bold text-emerald-600">₹4,250</p>
      </div>
      <div className="bg-white p-4 rounded-card border border-gray-200 shadow-subtle">
        <span className="text-xs text-gray-500 font-medium">Pending Orders</span>
        <p className="text-2xl font-bold text-amber-500">2</p>
      </div>
      <div className="bg-white p-4 rounded-card border border-gray-200 shadow-subtle">
        <span className="text-xs text-gray-500 font-medium">Avg Rating</span>
        <p className="text-2xl font-bold text-brand-text">4.8 ★</p>
      </div>
    </div>
  </div>
)
