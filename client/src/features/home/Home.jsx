import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Clock3, Fingerprint,
  MessageSquareText, ScanEye, ShieldCheck, Sparkles, UserRoundSearch,
} from 'lucide-react';

const features = [
  { icon: Sparkles, number: '01', title: 'AI-generated cases', copy: 'Your story becomes a one-of-a-kind fictional investigation, built around its own clues and cast.' },
  { icon: MessageSquareText, number: '02', title: 'Evidence with texture', copy: 'Read messages, compare witness accounts, and examine the details that shift the timeline.' },
  { icon: ScanEye, number: '03', title: 'A real investigation', copy: 'Move at your own pace, revisit each exhibit, and decide what the evidence actually says.' },
  { icon: ShieldCheck, number: '04', title: 'An answer you can prove', copy: 'Make your accusation, then see the reasoning and evidence behind the final reveal.' },
];

const steps = [
  ['01', 'Enter your story', 'Start with a strange event, a missing object, or a detail that does not add up.'],
  ['02', 'AI builds the mystery', 'Meet the fictional suspects and get a case file shaped around your scenario.'],
  ['03', 'Investigate the evidence', 'Open every exhibit. Follow the timeline. Look for the detail that changes everything.'],
  ['04', 'Find the culprit', 'Choose your suspect and get a verdict with an evidence-based explanation.'],
];

export default function Home() {
  return <main className="landing">
    <section className="landing-hero section-container">
      <div className="landing-copy">
        <div className="eyebrow landing-kicker"><span className="live-dot"/> A CASE BUILT AROUND YOUR STORY</div>
        <h1>Turn any story into a <em>mystery investigation.</em></h1>
        <p className="landing-lede">Create AI-powered detective cases, examine clues, question the evidence, and uncover the truth.</p>
        <div className="landing-actions">
          <Link to="/create" className="button button-primary">Create Mystery <ArrowUpRight size={17}/></Link>
          <a className="landing-secondary" href="#how-it-works">How it works <ArrowDown size={15}/></a>
        </div>
        <div className="hero-footnote"><span className="cyan-rule"/> FICTIONAL CASES · YOUR DEDUCTION</div>
      </div>
      <div className="landing-visual" role="img" aria-label="Illustrated fictional detective case board with a timeline, clue cards, and evidence connections">
        <div className="visual-toolbar"><span><i/> CASE ROOM / 0084</span><span>FICTIONAL FILE</span></div>
        <div className="board-grid"/>
        <div className="board-window"><div/><div/><div/><div/></div>
        <div className="board-orbit orbit-one"/><div className="board-orbit orbit-two"/>
        <div className="board-person"><span/><i/></div>
        <div className="board-thread thread-one"/><div className="board-thread thread-two"/>
        <article className="board-note note-a"><small>EXHIBIT A / MESSAGE LOG</small><strong>The last call</strong><span>23:16 · 00:42 SEC</span></article>
        <article className="board-note note-b"><small>WITNESS STATEMENT</small><strong>“I heard the door.”</strong><span>RECORDED · 08:10</span></article>
        <article className="board-note note-c"><small>TIMELINE / 21:40</small><strong>Lights go out</strong><span>GALLERY · NORTH WING</span></article>
        <span className="board-pin pin-a"/><span className="board-pin pin-b"/><span className="board-pin pin-c"/>
        <div className="visual-caption"><div><small>OPEN INVESTIGATION</small><strong>Every detail belongs somewhere.</strong></div><Fingerprint size={22}/></div>
      </div>
      <div className="hero-scroll"><span>SCROLL TO INVESTIGATE</span><ArrowDown size={14}/></div>
    </section>

    <section className="feature-section section-container" aria-labelledby="features-title">
      <div className="section-title-row"><div><p className="eyebrow">A BETTER KIND OF STORY</p><h2 id="features-title">Curiosity is your <em>best tool.</em></h2></div><p>Not a story to read. A mystery to get your hands on.</p></div>
      <div className="feature-grid">{features.map(({icon:Icon,number,title,copy})=><article className="feature-card" key={number}><div className="feature-card-top"><span>{number} / 04</span><Icon size={20}/></div><h3>{title}</h3><p>{copy}</p><ArrowRight className="feature-arrow" size={16}/></article>)}</div>
    </section>

    <section className="process-section" id="how-it-works" aria-labelledby="process-title">
      <div className="section-container process-inner"><div className="section-title-row process-title"><div><p className="eyebrow">THE INVESTIGATION</p><h2 id="process-title">Four steps to <em>the truth.</em></h2></div><p>Pay attention. Ask better questions. Let the case lead you somewhere.</p></div>
        <div className="process-grid">{steps.map(([number,title,copy])=><article className="process-card" key={number}><div className="process-number">{number}<span> / 04</span></div><div className="process-icon">{number==='01'?<AudioLines/>:number==='02'?<Sparkles/>:number==='03'?<ScanEye/>:<UserRoundSearch/>}</div><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </div>
    </section>

    <section className="sample-section section-container" id="case-preview" aria-labelledby="sample-title">
      <div className="section-title-row"><div><p className="eyebrow">A GLIMPSE INSIDE</p><h2 id="sample-title">The case is <em>never simple.</em></h2></div><span className="preview-label"><i/> FICTIONAL CASE PREVIEW</span></div>
      <article className="sample-card">
        <div className="sample-art" role="img" aria-label="Illustrative night scene of a museum gallery with one empty picture frame">
          <div className="sample-art-grid"/><div className="gallery-window"><i/><i/><i/><i/></div><div className="empty-frame"><span/></div><div className="gallery-shadow"/><div className="sample-art-label"><span>SCENE 01</span><span>ILLUSTRATIVE ARTWORK</span></div>
        </div>
        <div className="sample-copy"><p className="eyebrow">SAMPLE FILE · NOT A GENERATED CASE</p><h3>The Last Light<br/><em>at Bellweather.</em></h3><p>A museum gallery goes dark for eleven minutes. When the lights return, an empty frame is all that remains—and four guests remember the blackout differently.</p><div className="sample-meta"><span><UserRoundSearch size={15}/> 04 SUSPECTS</span><span><Clock3 size={15}/> 08 EXHIBITS</span><span>MEDIUM</span></div><Link to="/create" className="sample-link">Build your own case <ArrowUpRight size={16}/></Link></div>
      </article>
    </section>

    <section className="landing-cta section-container"><div className="cta-mark"><Fingerprint size={25}/></div><div><p className="eyebrow">YOUR FIRST CLUE IS A STORY</p><h2>Ready to find out<br/>what <em>really happened?</em></h2></div><Link to="/create" className="button button-primary">Create Mystery <ArrowUpRight size={17}/></Link><span className="cta-stamp">FICTIONAL<br/>INVESTIGATIONS</span></section>
    <div className="fiction-notice"><ShieldCheck size={15}/><span>All stories, suspects, and evidence are fictional. This is an interactive game, not a real investigation.</span></div>
  </main>;
}
