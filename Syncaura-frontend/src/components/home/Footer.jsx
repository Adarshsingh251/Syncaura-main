import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Facebook, Instagram, Linkedin, Youtube,
  Twitter, Send, Zap, ArrowRight,
  MapPin, Mail, Phone,
} from 'lucide-react';

/* ── Social links with brand colors ── */
const socials = [
  { icon: Facebook,  label: 'Facebook',  href: '#', color: '#1877f2' },
  { icon: Twitter,   label: 'X / Twitter', href: '#', color: '#000000' },
  { icon: Instagram, label: 'Instagram', href: '#', color: '#e1306c' },
  { icon: Linkedin,  label: 'LinkedIn',  href: '#', color: '#0a66c2' },
  { icon: Youtube,   label: 'YouTube',   href: '#', color: '#ff0000' },
];

const ColHeading = ({ children }) => (
  <div className="mb-5">
    <h4 className="text-sm font-black tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
      {children}
    </h4>
    <div
      className="mt-1.5 h-[2px] w-8 rounded-full"
      style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
    />
  </div>
);

const NavLink = ({ children, href, onClick }) => (
  <li>
    <a href={href} onClick={onClick}>
      <motion.span
        whileHover={{ x: 4 }}
        className="flex items-center gap-1.5 text-sm cursor-pointer group transition-colors duration-200"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6366f1' }} />
        <span className="group-hover:text-indigo-400 transition-colors">{children}</span>
      </motion.span>
    </a>
  </li>
);

const Footer = () => {
  const [email, setEmail] = useState(''); // Stores the user's email input
  const [status, setStatus] = useState(''); // Stores success or error messages

  const scrollToSection = (e, sectionId) => {
    if (!sectionId) return;
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  };

  // Handles the newsletter form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return setStatus('Enter an email address.');
    
    // Basic regex to check for valid email format (contains @ and .)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setStatus('Invalid email address.');
    
    setStatus('✓ Subscribed successfully!');
    setEmail('');
    
    // Clear the success message after 3 seconds
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <footer
      className="w-full relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}
    >
      {/* Rainbow top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6, #ec4899, #f59e0b)' }}
      />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[120px]"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 pt-14 pb-8">

        {/* 
          MAIN FOOTER GRID
          Configures a responsive layout for the columns:
          - Mobile: 1 column
          - Tablet: 2 columns
          - Desktop: 4 columns with custom fractional widths (the brand col is widest)
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2.2fr_1fr_1fr_1.4fr] gap-12 lg:gap-16 mb-12">

          {/* ── Brand + Newsletter ── */}
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                <Zap size={18} className="text-white" />
              </div>
              <span
                className="text-2xl font-black text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)' }}
              >
                FlowBit
              </span>
            </div>

            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              The all-in-one platform that unifies your team's projects, chats, meetings, and performance — so you can focus on what matters.
            </p>

            {/* Contact info */}
            <div className="space-y-2">
              {[
                { icon: Mail,    text: 'hello@FlowBit.io'    },
                { icon: Phone,   text: '+1 (800) 123-4567'  },
                { icon: MapPin,  text: 'San Francisco, CA'  },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Icon size={13} style={{ color: '#6366f1', flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Stay in the loop
              </p>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
                >
                  <Send size={15} />
                </motion.button>
              </form>
              {status && (
                <p className="text-xs" style={{ color: status.includes('✓') ? '#22c55e' : '#f43f5e' }}>
                  {status}
                </p>
              )}
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* ── Product ── */}
          <div>
            <ColHeading>Product</ColHeading>
            <ul className="space-y-3">
              {[
                { label: 'Features', id: 'features' },
                { label: 'Security' },
                { label: 'Roadmap' },
                { label: 'Changelog' },
                { label: 'Status' }
              ].map(item => (
                <NavLink 
                  key={item.label} 
                  href={item.id ? `#${item.id}` : undefined}
                  onClick={item.id ? (e) => scrollToSection(e, item.id) : undefined}
                >
                  {item.label}
                </NavLink>
              ))}
            </ul>
          </div>

          {/* ── Company ── */}
          <div>
            <ColHeading>Company</ColHeading>
            <ul className="space-y-3">
              {['About us', 'Blog', 'Careers', 'Press kit', 'Contact', 'Partners'].map(item => (
                <NavLink key={item}>{item}</NavLink>
              ))}
            </ul>
          </div>

          {/* ── Follow Us ── */}
          <div>
            <ColHeading>Follow Us</ColHeading>
            <div className="space-y-3">
              {socials.map(({ icon: Icon, label, href, color }) => (
                <motion.a
                  key={label}
                  href={href}
                  whileHover={{ x: 4, scale: 1.02 }}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  {/* Icon bubble */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                      boxShadow: `0 2px 8px ${color}15`,
                    }}
                  >
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span
                    className="text-sm font-medium group-hover:text-indigo-400 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {label}
                  </span>
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {/* Copyright */}
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
            © 2025{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>FlowBit, Inc.</span>
            {' '}All rights reserved.
          </p>

          {/* Legal links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Settings', 'Accessibility'].map((link, i, arr) => (
              <React.Fragment key={link}>
                <span className="hover:text-indigo-400 cursor-pointer transition-colors">{link}</span>
                {i < arr.length - 1 && <span className="opacity-30">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
