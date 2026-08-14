import React from 'react';
import { useSelector } from 'react-redux';

export default function Profile() {
  // Access global user authentication status directly from Redux
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-md space-y-4 my-8 text-slate-800 dark:text-slate-100">
      <div className="border-b border-slate-200 dark:border-zinc-700 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">User Account Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your logged-in application metrics</p>
      </div>

      {user ? (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Account ID:</span>
            <span className="font-mono text-sm">{user.id || user._id || 'N/A'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Full Name:</span>
            <span>{user.name || 'Anonymous User'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Email Address:</span>
            <span>{user.email}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between pb-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Project Role:</span>
            <span className="capitalize px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-sm font-medium w-fit">
              {user.role}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg">
          No profile information could be found. Please check your login session.
        </div>
      )}
    </div>
  );
}