import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const SharedButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyle = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 active:scale-95';
  let variantStyle = '';

  if (variant === 'primary') {
    variantStyle = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 focus:ring-indigo-500';
  } else if (variant === 'secondary') {
    variantStyle = 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-100 focus:ring-teal-500';
  } else if (variant === 'outline') {
    variantStyle = 'border border-slate-200 hover:bg-slate-50 text-slate-700 focus:ring-slate-400';
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};
