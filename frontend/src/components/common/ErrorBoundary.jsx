import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-7 border border-slate-200 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                কিছু একটা ত্রুটি ঘটেছে / Something went wrong
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                অ্যাপ্লিকেশনটি লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পেজটি রিলোড করুন অথবা হোম পেজে ফিরে যান।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-primary hover:bg-blue-900 text-white font-bold text-xs shadow-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>রিলোড করুন</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>হোম পেজ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

