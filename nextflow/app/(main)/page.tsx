import { ArrowRight, Image as ImageIcon, Video, Wand2, Edit3 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center w-full min-h-full p-4 sm:p-8 md:p-12 lg:p-16 gap-8 sm:gap-12 bg-[#0a0a09] text-white overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 min-h-[200px] sm:aspect-[21/9] border border-[#1E1E2E]">
        {/* Abstract Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a24] to-[#0a0a09] opacity-80 z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a09]/0 to-transparent z-0" />
        
        <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-center">
            Start by generating a free image
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <button className="group flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors">
              Generate Image
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button className="group flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800/80 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors border border-zinc-700">
              Generate Video
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="w-full max-w-5xl grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Image Generation */}
        <div className="group relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden cursor-not-allowed border border-[#1E1E2E]">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-400 opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-lg shadow-black/20 text-blue-500">
              <ImageIcon size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Video Generation */}
        <div className="group relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden cursor-not-allowed border border-[#1E1E2E]">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="p-2 sm:p-3 bg-yellow-500 rounded-lg sm:rounded-xl shadow-lg shadow-black/20 text-white">
              <Video size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Enhancer */}
        <div className="group relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden cursor-not-allowed border border-[#1E1E2E]">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="p-2 sm:p-3 bg-zinc-800 rounded-lg sm:rounded-xl shadow-lg shadow-black/20 text-white">
              <Wand2 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Image Editing */}
        <div className="group relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden cursor-not-allowed border border-[#1E1E2E]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-zinc-900" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="p-2 sm:p-3 bg-blue-500 rounded-lg sm:rounded-xl shadow-lg shadow-black/20 text-white">
              <Edit3 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
