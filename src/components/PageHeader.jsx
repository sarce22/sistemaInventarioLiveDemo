import React from 'react';

const PageHeader = ({ title, subtitle }) => {
  return (
    <div className="flex flex-col justify-between items-start mb-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-sans">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

export default PageHeader;

