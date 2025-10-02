// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';

interface OnboardingModalProps {
  onAcknowledge: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onAcknowledge }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center fade-in">
      <div 
        className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/50 w-full max-w-2xl m-4 p-8 text-center animate-pop-in"
      >
        <h1 className="text-3xl font-bold mb-4 text-primary font-serif">Welcome to the Reality Engine</h1>
        <p className="text-text-secondary mb-6 text-lg">
          This is not an application. It is an operating system for intent.
        </p>
        <div className="text-left space-y-4 text-text-primary mb-8 max-w-lg mx-auto">
            <p>
                <strong className="text-primary">1. Command Reality:</strong> Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700">Ctrl/Cmd + K</kbd> to open the Command Palette. Access any tool using natural language.
            </p>
             <p>
                <strong className="text-primary">2. Wield the Instruments:</strong> The feature dock on the left provides access to the core pillars of the Engine. Drag and drop features, build workflows, and synthesize new tools on the fly.
            </p>
            <p>
                <strong className="text-primary">3. Secure Your Keys:</strong> Your credentials for external services (like GitHub) are encrypted with a Master Password you create. This password is never stored, ensuring only you can access your secrets.
            </p>
        </div>
        <button
          onClick={onAcknowledge}
          className="btn-primary px-8 py-3 text-lg"
        >
          Acknowledge & Begin
        </button>
      </div>
    </div>
  );
};
