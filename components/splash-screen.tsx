import { Wrench } from 'lucide-react'

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
          <div className="relative bg-slate-900 rounded-full p-6">
            <Wrench className="w-16 h-16 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            MaintainIQ
          </h1>
          <p className="text-lg text-slate-300">Intelligent Asset Maintenance Simplified</p>
        </div>

        {/* Loading animation */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-slate-400 text-sm">Loading MaintainIQ...</p>
        </div>

        {/* Features preview */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div className="px-4">
            <div className="text-2xl font-bold text-cyan-400">500+</div>
            <p className="text-xs text-slate-400">Enterprise Teams</p>
          </div>
          <div className="px-4 border-l border-r border-slate-700">
            <div className="text-2xl font-bold text-blue-400">99.9%</div>
            <p className="text-xs text-slate-400">Uptime SLA</p>
          </div>
          <div className="px-4">
            <div className="text-2xl font-bold text-indigo-400">24/7</div>
            <p className="text-xs text-slate-400">Support</p>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
