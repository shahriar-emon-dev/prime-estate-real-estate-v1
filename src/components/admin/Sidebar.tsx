'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaChevronDown, FaSignOutAlt, FaUserCog, FaTimes } from 'react-icons/fa';
import { logout } from '@/lib/auth';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState<string | null>('properties');
  const [loggingOut, setLoggingOut] = useState(false);

  // Check if path is active (exact or starts with for nested routes)
  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) onClose();
  };

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: '📊',
    },
    {
      label: 'Users',
      icon: '👥',
      submenu: [
        { label: 'All Users', href: '/admin/users' },
        { label: 'Create User', href: '/admin/users/create' },
      ],
    },
    {
      label: 'Properties',
      icon: '🏠',
      submenu: [
        { label: 'All Properties', href: '/admin/properties' },
        { label: 'Add Property', href: '/admin/properties/add' },
      ],
    },
    {
      label: 'Master Data',
      icon: '⚙️',
      submenu: [
        { label: 'Cities', href: '/admin/master-data/cities' },
        { label: 'Areas', href: '/admin/master-data/areas' },
        { label: 'Projects', href: '/admin/master-data/projects' },
        { label: 'Property Types', href: '/admin/master-data/property-types' },
      ],
    },
    {
      label: 'Requests',
      icon: '📋',
      submenu: [
        { label: 'Meeting Requests', href: '/admin/requests/meeting-requests' },
        { label: 'Site Visit Requests', href: '/admin/requests/site-visit-requests' },
      ],
    },
    {
      label: 'Calendar',
      href: '/admin/calendar',
      icon: '📅',
    },
    {
      label: 'Bookings',
      href: '/admin/bookings',
      icon: '📋',
    },
    {
      label: 'User Logs',
      href: '/admin/user-logs',
      icon: '📜',
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen fixed top-0 lg:top-16 left-0 overflow-y-auto flex flex-col shadow-2xl lg:shadow-none">
      {/* Mobile Header with Close Button */}
      <div className="lg:hidden p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">PE</span>
          </div>
          <div>
            <span className="font-bold text-white">Admin Panel</span>
            <p className="text-xs text-gray-300">Prime Estate</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          aria-label="Close menu"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item, index) => (
          <div key={index}>
            {item.href ? (
              // Single menu item (no submenu)
              <Link
                href={item.href}
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ) : (
              // Menu item with submenu
              <>
                <button
                  onClick={() => setExpandedMenu(expandedMenu === item.label ? null : item.label)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                    ${expandedMenu === item.label || item.submenu?.some(sub => isActive(sub.href))
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <FaChevronDown
                    className={`text-sm transition-transform duration-200 ${
                      expandedMenu === item.label ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Submenu with animation */}
                <div 
                  className={`
                    overflow-hidden transition-all duration-200 ease-in-out
                    ${expandedMenu === item.label ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                  `}
                >
                  <div className="space-y-1 mt-1.5 ml-4 pl-4 border-l-2 border-gray-700">
                    {item.submenu?.map((subitem, subindex) => (
                      <Link
                        key={subindex}
                        href={subitem.href}
                        onClick={handleLinkClick}
                        className={`
                          block px-4 py-2.5 rounded-lg transition-all duration-200 text-sm
                          ${isActive(subitem.href)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }
                        `}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Section - Profile & Logout */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-2">
        {/* Profile Button */}
        <Link
          href="/admin/profile"
          onClick={handleLinkClick}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium
            ${isActive('/admin/profile')
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-gray-700/50 hover:bg-gray-700 text-white'
            }
          `}
        >
          <FaUserCog className="text-lg" />
          <span>Profile Settings</span>
        </Link>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
        >
          <FaSignOutAlt />
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}
