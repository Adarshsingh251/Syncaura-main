import React from 'react';

const RoleSelector = ({ selectedRole, onRoleChange }) => {
  const roles = [
    { id: 'admin', label: 'Admin', sub: 'Register as an admin' },
    { id: 'user', label: 'User (Intern)', sub: 'Register as an intern' }
  ];

  return (
    <div className="w-full mb-6 font-poppin-reg">
      {/* Label for the selection group */}
      <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">
        Select Registration Role
      </label>
      
      {/* 3 Button Grid Layout */}
      <div className="grid grid-cols-3 gap-3">
        {roles.map((role) => {
          const isActive = selectedRole === role.id;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onRoleChange(role.id)}
              className={`
                flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-200 btn-hover
                ${isActive 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md dark:bg-blue-500 dark:border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 dark:bg-zinc-900 dark:text-gray-300 dark:border-zinc-700'
                }
              `}
            >
              <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {role.label}
              </span>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                {role.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
