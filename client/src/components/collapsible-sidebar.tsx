import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Gamepad2, 
  Home, 
  User as UserIcon, 
  History, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CollapsibleSidebarProps {
  onLogout: () => void;
}

export default function CollapsibleSidebar({ onLogout }: CollapsibleSidebarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Sidebar */}
      <aside className={`${
        sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 lg:w-64'
      } fixed lg:relative top-0 left-0 h-full w-64 bg-zinc-800/50 backdrop-blur-sm border-r border-zinc-700 min-h-screen transition-all duration-300 z-40`}>
        <div className={`p-6 ${sidebarCollapsed ? 'lg:p-3' : ''}`}>
          <div className={`flex items-center mb-8 ${sidebarCollapsed ? 'lg:justify-center lg:space-x-0' : 'space-x-3'}`}>
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-black" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-white lg:block">Gaming Wallet</span>
            )}
          </div>
          
          <nav className="space-y-2">
            {/* Hamburger toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full flex items-center text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors ${
                sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-3 px-4 py-3' : 'space-x-3 px-4 py-3'
              }`}
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              {!sidebarCollapsed && <span className="lg:block">Collapse Menu</span>}
            </button>

            <Link href="/">
              <a className={`flex items-center rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors ${
                isActive('/') ? 'bg-zinc-700/30 text-white' : 'text-gray-300'
              } ${sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-3 px-4 py-3' : 'space-x-3 px-4 py-3'}`}>
                <Home className="h-5 w-5" />
                {!sidebarCollapsed && <span className="lg:block">Dashboard</span>}
              </a>
            </Link>
            
            <Link href="/profile">
              <a className={`flex items-center rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors ${
                isActive('/profile') ? 'bg-zinc-700/30 text-white' : 'text-gray-300'
              } ${sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-3 px-4 py-3' : 'space-x-3 px-4 py-3'}`}>
                <UserIcon className="h-5 w-5" />
                {!sidebarCollapsed && <span className="lg:block">Profile</span>}
              </a>
            </Link>
            
            <Link href="/games">
              <a className={`flex items-center rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors ${
                isActive('/games') ? 'bg-zinc-700/30 text-white' : 'text-gray-300'
              } ${sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-3 px-4 py-3' : 'space-x-3 px-4 py-3'}`}>
                <Gamepad2 className="h-5 w-5" />
                {!sidebarCollapsed && <span className="lg:block">Games</span>}
              </a>
            </Link>
            
            <Link href="/transactions">
              <a className={`flex items-center rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors ${
                isActive('/transactions') ? 'bg-zinc-700/30 text-white' : 'text-gray-300'
              } ${sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-3 px-4 py-3' : 'space-x-3 px-4 py-3'}`}>
                <History className="h-5 w-5" />
                {!sidebarCollapsed && <span className="lg:block">Transaction History</span>}
              </a>
            </Link>
            
            <button
              onClick={onLogout}
              className={`w-full flex items-center text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors text-left ${
                sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-3 px-4 py-3' : 'space-x-3 px-4 py-3'
              }`}
            >
              <LogOut className="h-5 w-5" />
              {!sidebarCollapsed && <span className="lg:block">Logout</span>}
            </button>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </>
  );
}