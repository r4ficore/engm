import React from 'react';
import { Home, LayoutTemplate, Compass, Wallet, History, MoreHorizontal, Plus, Download, Trash2, MessageSquare, FolderOpen } from 'lucide-react';
import { ChatSession, Project } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  projects: Project[];
  currentProjectId: string | null;
  onLoadSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDownloadSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
  onSelectProject: (project: Project) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  projects,
  currentProjectId,
  onLoadSession, 
  onNewChat, 
  onDownloadSession,
  onDeleteSession,
  onSelectProject
}) => {
  return (
    <div className="hidden md:flex flex-col w-64 h-screen bg-jet border-r border-borderDark text-gray-400 p-4 relative glass-panel">
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2 mt-2">
        <div className="w-8 h-8 relative">
           <div className="absolute inset-0 bg-gold rounded-lg opacity-20 rotate-45"></div>
           <div className="absolute inset-0 border border-gold rounded-lg flex items-center justify-center text-gold font-display font-bold text-lg">
             A
           </div>
        </div>
        <span className="text-xl font-display font-bold text-gradient-gold tracking-wide">ENIGMA</span>
      </div>

      {/* Main Navigation (Restored) */}
      <nav className="space-y-1 mb-8">
        <NavItem icon={<Home size={18} />} label="Dashboard" active />
        <NavItem icon={<Compass size={18} />} label="Explore" />
        <NavItem icon={<Wallet size={18} />} label="Credits" />
      </nav>

       {/* Projects List (Restored) */}
       <div className="mb-8">
         <div className="px-2 mb-3 flex items-center justify-between">
            <span className="text-[10px] font-display font-bold text-gold-dim uppercase tracking-[0.2em] opacity-80">
                Contexts
            </span>
         </div>
         <div className="space-y-1">
             {projects.map(project => (
                 <button
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm transition-all duration-200 group ${currentProjectId === project.id ? 'bg-white/5 text-white border-l-2 border-gold' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'}`}
                 >
                     <FolderOpen size={16} className={currentProjectId === project.id ? 'text-gold' : 'text-gray-600 group-hover:text-gold-dim'} />
                     <span className="text-xs font-medium truncate">{project.name}</span>
                 </button>
             ))}
         </div>
      </div>

      {/* New Chat Button */}
      <button 
        onClick={onNewChat}
        className="flex items-center justify-center gap-2 w-full bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-xs font-display font-bold tracking-wider uppercase py-3 rounded-sm mb-6 transition-all group"
      >
        <Plus size={14} className="group-hover:rotate-90 transition-transform" />
        New Sequence
      </button>

      {/* Search - Glass Input */}
      <div className="mb-6 relative">
        <input 
          type="text" 
          placeholder="Search memory..." 
          className="w-full bg-graphite/50 border border-borderDark text-xs font-mono text-gray-300 rounded-none pl-9 pr-3 py-2.5 focus:outline-none focus:border-gold/50 transition-colors placeholder:text-gray-600"
        />
        <svg className="w-3.5 h-3.5 absolute left-3 top-3 text-gold-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Active Sessions (History) */}
      <div className="mb-3 px-2 flex items-center justify-between">
         <span className="text-[10px] font-display font-bold text-gold-dim uppercase tracking-[0.2em] opacity-80">
            Memory Logs
         </span>
         <span className="text-[9px] font-mono text-gray-600">10D RETENTION</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 mb-4 pr-1 scrollbar-thin">
        {sessions.length === 0 ? (
            <div className="px-3 py-4 text-center border border-dashed border-white/5 rounded-sm">
                <p className="text-[10px] text-gray-600 font-mono">NO ACTIVE LOGS</p>
            </div>
        ) : (
            sessions.map((session) => (
                <div 
                    key={session.id}
                    className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all duration-300 border-l-2 ${currentSessionId === session.id ? 'bg-white/5 border-gold text-white' : 'border-transparent hover:bg-white/5 hover:text-gray-200'}`}
                >
                    <div className="flex-1 min-w-0" onClick={() => onLoadSession(session)}>
                        <div className="text-xs font-sans font-medium truncate mb-0.5">{session.title}</div>
                        <div className="text-[10px] font-mono text-gray-600 flex items-center gap-2">
                             <span>{new Date(session.lastModified).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}</span>
                             <span>•</span>
                             <span>{session.modeId.split(' ')[0]}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDownloadSession(session); }}
                            className="p-1.5 text-gray-500 hover:text-gold transition-colors rounded-sm"
                            title="Download Log (.txt)"
                        >
                            <Download size={12} />
                        </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-sm"
                            title="Delete Log"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
      
      {/* User Profile (Bottom) */}
      <div className="mt-auto pt-4 border-t border-borderDark flex items-center gap-3 px-2 cursor-pointer hover:bg-white/5 p-2 transition-colors">
          <div className="w-8 h-8 rounded-full border border-gold/30 bg-graphite flex items-center justify-center">
             <div className="w-2 h-2 bg-gold rounded-full animate-pulse-slow"></div>
          </div>
          <div className="flex-1">
              <div className="text-xs font-display font-semibold text-white tracking-wide">PRO_UNIT_01</div>
              <div className="text-[10px] text-gray-500 font-mono">System Online</div>
          </div>
          <MoreHorizontal size={14} className="text-gold-dim" />
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 group ${active ? 'bg-white/5 text-gold border-l-2 border-gold' : 'text-gray-400 hover:bg-white/5 hover:text-gray-100 border-l-2 border-transparent'}`}>
    <span className={`${active ? 'text-gold' : 'text-gray-500 group-hover:text-gray-300'}`}>{icon}</span>
    <span className="text-sm font-medium tracking-wide">{label}</span>
  </button>
);

export default Sidebar;