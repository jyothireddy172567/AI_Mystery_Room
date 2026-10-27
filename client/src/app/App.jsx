import { useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import Home from '../features/home/Home.jsx';
import Create from '../features/mystery-creation/Create.jsx';
import Investigation from '../features/investigation/Investigation.jsx';
import Results from '../features/results/Results.jsx';

function Brand({ footer = false }) {
  return <Link className={`brand${footer ? ' footer-brand' : ''}`} to="/" aria-label="AI Mystery Room home">
    <img className="brand-logo" src="/ai-mystery-room-logo.png" alt="" aria-hidden="true"/>
    <span className="brand-copy"><strong>AI MYSTERY ROOM</strong><small>FICTIONAL CASES · REAL DEDUCTION</small></span>
  </Link>;
}

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner">
      <Brand/>
      <nav className={`primary-nav${menuOpen ? ' is-open' : ''}`} id="primary-navigation" aria-label="Main navigation">
        <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
        <a href="/#how-it-works" onClick={closeMenu}>How it works</a>
        <Link className="nav-cta" to="/create" onClick={closeMenu}>Create Mystery <ArrowUpRight size={15}/></Link>
      </nav>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(open => !open)}>
        {menuOpen ? <X size={20}/> : <Menu size={20}/>}
      </button>
    </div></header>
    {children}
    <footer className="footer"><div className="footer-inner">
      <Brand footer/>
      <p>Every story leaves a clue. Follow it to the truth.</p>
      <nav aria-label="Footer navigation"><Link to="/">Home</Link><a href="/#how-it-works">How it works</a><Link to="/create">Create Mystery</Link></nav>
      <small>© 2026 AI Mystery Room · Fictional investigations only</small>
    </div></footer>
  </div>;
}

function NotFound() {
  return <main className="not-found"><p className="eyebrow">404 · FILE NOT FOUND</p><h1>This trail ends here.</h1><Link className="button button-primary" to="/">Return to the room</Link></main>;
}

export default function App() {
  return <Layout><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/create" element={<Create/>}/>
    <Route path="/case/:caseId" element={<Investigation/>}/>
    <Route path="/case/:caseId/results" element={<Results/>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes></Layout>;
}
