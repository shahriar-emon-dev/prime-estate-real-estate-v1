'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { InitialSession } from './NavbarWrapper';

interface NavbarProps {
  userSession: InitialSession;
}

export default function Navbar({ userSession }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // User and role from server-side session
  const user = userSession.user;
  const userRole = userSession.role;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    router.push('/');
  };

  /**
   * Get display label for user role
   * Supports all roles: admin, seller, agent, user (buyer)
   */
  const getRoleLabel = (role: string | null): string => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'seller':
        return 'Seller';
      case 'agent':
        return 'Agent';
      case 'user':
      default:
        return 'Buyer';
    }
  };

  /**
   * Get dashboard link for current user role
   */
  const getDashboardLink = (role: string | null): string | null => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'seller':
        return '/seller/dashboard';
      case 'agent':
        return '/agent/dashboard';
      default:
        return null;
    }
  };

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black shadow-lg' : 'bg-white'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/prime_estate.png" 
                  alt="PrimeEstate Logo" 
                  width={150} 
                  height={48} 
                  className="h-12 w-auto"
                  priority
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? isScrolled 
                      ? 'border-white text-white'
                      : 'border-blue-500 text-gray-900'
                    : isScrolled
                      ? 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                href="/properties"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/properties')
                    ? isScrolled 
                      ? 'border-white text-white'
                      : 'border-blue-500 text-gray-900'
                    : isScrolled
                      ? 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Properties
              </Link>
              <Link
                href="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/about')
                    ? isScrolled 
                      ? 'border-white text-white'
                      : 'border-blue-500 text-gray-900'
                    : isScrolled
                      ? 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                About
              </Link>
              <Link
                href="/contact"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/contact')
                    ? isScrolled 
                      ? 'border-white text-white'
                      : 'border-blue-500 text-gray-900'
                    : isScrolled
                      ? 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Contact
              </Link>
              <Link
                href="/book"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/book')
                    ? isScrolled 
                      ? 'border-white text-white'
                      : 'border-blue-500 text-gray-900'
                    : isScrolled
                      ? 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Book a Visit
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`flex items-center gap-2 rounded-full transition-colors ${
                    isScrolled
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                  } p-1 pr-3`}
                >
                  {/* Avatar circle */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    isScrolled
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {(user.email?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <span className={`text-sm font-medium max-w-[100px] truncate ${
                    isScrolled ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {user.email?.split('@')[0]}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''} ${
                    isScrolled ? 'text-gray-400' : 'text-gray-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl z-50 overflow-hidden bg-white border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                        {getRoleLabel(userRole)}
                      </span>
                    </div>

                    <div className="py-1">
                      {/* Dashboard link based on role */}
                      {getDashboardLink(userRole) && (
                        <Link
                          href={getDashboardLink(userRole)!}
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Dashboard
                        </Link>
                      )}

                      <Link
                        href="/favorites"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        My Favorites
                      </Link>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isScrolled 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
              } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className={`sm:hidden ${isScrolled ? 'bg-black' : 'bg-white'}`}>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/')
                  ? isScrolled
                    ? 'bg-gray-900 border-white text-white'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : isScrolled
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Home
            </Link>
            <Link
              href="/properties"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/properties')
                  ? isScrolled
                    ? 'bg-gray-900 border-white text-white'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : isScrolled
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Properties
            </Link>
            <Link
              href="/about"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/about')
                  ? isScrolled
                    ? 'bg-gray-900 border-white text-white'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : isScrolled
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/contact')
                  ? isScrolled
                    ? 'bg-gray-900 border-white text-white'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : isScrolled
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Contact
            </Link>
            <Link
              href="/book"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/book')
                  ? isScrolled
                    ? 'bg-gray-900 border-white text-white'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : isScrolled
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Book a Visit
            </Link>
          </div>
          <div className="space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {(user.email?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isScrolled ? 'text-white' : 'text-gray-900'}`}>
                      {user.email}
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                </div>

                {/* Show dashboard link based on role */}
                {getDashboardLink(userRole) && (
                  <Link
                    href={getDashboardLink(userRole)!}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      pathname === getDashboardLink(userRole)
                        ? isScrolled
                          ? 'bg-gray-900 border-white text-white'
                          : 'bg-blue-50 border-blue-500 text-blue-700'
                        : isScrolled
                          ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                          : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}

                <Link
                  href="/favorites"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/favorites'
                      ? isScrolled
                        ? 'bg-gray-900 border-white text-white'
                        : 'bg-blue-50 border-blue-500 text-blue-700'
                      : isScrolled
                        ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  My Favorites
                </Link>

                <button
                  onClick={handleLogout}
                  className={`w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isScrolled
                      ? 'border-transparent text-red-400 hover:bg-gray-700'
                      : 'border-transparent text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent ${
                    isScrolled
                      ? 'text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent ${
                    isScrolled
                      ? 'text-emerald-400 hover:bg-gray-700'
                      : 'text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 