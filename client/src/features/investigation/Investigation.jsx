import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, Check, Clock3, FileText, Image as ImageIcon,
  LoaderCircle, MessageSquareText, ScanSearch, ShieldAlert, Video, UserRound,
} from 'lucide-react';
import { getMystery, getResult, submitAccusation, resolveAssetUrl } from '../../services/api.js';

const icons = { chat: MessageSquareText, image: ImageIcon, cctv: Video, witness: FileText, physical: ScanSearch, timeline: Clock3 };

export default function Investigation() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [active, setActive] = useState(0);
  const [suspect, setSuspect] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedResult, setSavedResult] = useState(null);
  const [failedImageKey, setFailedImageKey] = useState('');
  const submissionLock = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadCase() {
      setLoading(true);
      setError('');
      setSavedResult(null);
      setSuspect('');
      try {
        const caseData = await getMystery(caseId);
        if (cancelled) return;
        setData(caseData);
        try {
          const previous = await getResult(caseId);
          if (!cancelled) {
            setSavedResult(previous);
            setSuspect(previous.selectedSuspectId);
          }
        } catch (resultError) {
          // CASE_NOT_READY means this case has not been accused yet.
          // Other result lookup failures should not block evidence review.
          if (resultError.code !== 'CASE_NOT_READY' && !cancelled) {
            setError('We could not check for a saved accusation. Your evidence is still available; submitting again is safe.');
          }
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCase();
    return () => { cancelled = true; };
  }, [caseId]);

  async function accuse() {
    if (!suspect || submissionLock.current || savedResult) return;
    submissionLock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await submitAccusation(caseId, suspect);
      setSavedResult(result);
      navigate(`/case/${caseId}/results`);
    } catch (submitError) {
      if (submitError.code === 'ALREADY_SUBMITTED') {
        try {
          const previous = await getResult(caseId);
          setSavedResult(previous);
          setSuspect(previous.selectedSuspectId);
          navigate(`/case/${caseId}/results`);
          return;
        } catch (resultError) {
          setError(resultError.message || 'This case already has a saved accusation, but its result could not be loaded. Retry in a moment.');
        }
      } else {
        setError(submitError.message || 'Your accusation could not be submitted. Please try again.');
      }
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  }

  if (loading) return <main className="state-page"><LoaderCircle className="spin"/><p>Opening the case file…</p></main>;
  if (!data) return <main className="state-page"><ShieldAlert/><p>{error || 'We could not open this case.'}</p><Link to="/">Return to the room</Link></main>;

  const evidence = data.evidence || [];
  const item = evidence[active];
  const Icon = icons[item?.type] || FileText;
  const imageKey = item ? `${caseId}:${item.id}` : '';
  const imageReady = item?.type === 'image' && item.assetStatus === 'ready' && item.assetUrl && failedImageKey !== imageKey;

  return <main className="investigation-page">
    <div className="investigation-top"><Link to="/" className="back-link"><ArrowLeft size={15}/> EXIT CASE</Link><div className="case-status"><span className="live-dot"/> ACTIVE INVESTIGATION <i/> CASE {caseId.slice(-6).toUpperCase()}</div></div>
    <div className="case-intro"><div><p className="eyebrow">CASE FILE · {data.difficulty?.toUpperCase()} MODE</p><h1>{data.title}</h1><p className="case-summary">{data.summary}</p></div><div className="case-index"><span>CASE</span><strong>NO. {caseId.slice(-4).toUpperCase()}</strong><small>{data.setting || 'FICTIONAL LOCATION'}</small></div></div>

    <div className="investigation-layout">
      <aside className="suspects-panel">
        <div className="panel-heading"><div><p className="eyebrow">PERSONS OF INTEREST</p><h2>The suspects</h2></div><span>{data.suspects.length.toString().padStart(2, '0')}</span></div>
        <p className="panel-hint">{savedResult ? 'Your original accusation is saved for this case.' : 'Select one when you’re ready to make your accusation.'}</p>
        <div className="suspect-list">{data.suspects.map((person, index) => <button key={person.id} className={`suspect-card ${suspect === person.id ? 'selected' : ''}`} aria-pressed={suspect === person.id} disabled={Boolean(savedResult)} onClick={() => setSuspect(person.id)}>
          <span className="suspect-avatar">{person.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</span><span className="suspect-info"><strong>{person.name}</strong><small>{person.occupation}</small><span>{person.motive}</span></span><span className="suspect-check">{suspect === person.id && <Check size={15}/>}</span><span className="suspect-number">0{index + 1}</span>
        </button>)}</div>
        <div className="accusation-box"><p className="eyebrow">YOUR CALL</p>
          {savedResult ? <><p>Your accusation has already been recorded. Its original result is ready.</p><Link className="button button-primary full-button" to={`/case/${caseId}/results`}>View saved result <ArrowUpRight size={16}/></Link></> : <>
            <p>{suspect ? 'You have a theory. Ready to stand by it?' : 'Choose a suspect to make your accusation.'}</p>
            <button className="button button-primary full-button" disabled={!suspect || busy} onClick={accuse}>{busy ? <><LoaderCircle className="spin" size={16}/> Reviewing…</> : <>Submit accusation <ArrowUpRight size={16}/></>}</button>
          </>}
          {error && <p className="inline-error" role="alert">{error}</p>}
        </div>
      </aside>

      <section className="evidence-panel"><div className="panel-heading"><div><p className="eyebrow">THE EVIDENCE ROOM</p><h2>Exhibits</h2></div><span>{evidence.length.toString().padStart(2, '0')} ITEMS</span></div>
        <div className="evidence-tabs" role="tablist" aria-label="Case exhibits">{evidence.map((entry, index) => { const TabIcon = icons[entry.type] || FileText; return <button role="tab" aria-selected={active === index} key={entry.id} onClick={() => setActive(index)}><TabIcon size={15}/><span>{String(index + 1).padStart(2, '0')}</span></button>; })}</div>
        {item && <article className="exhibit-detail"><div className={`exhibit-visual visual-${item.type}`}>
          {imageReady ? <img className="evidence-generated-image" crossOrigin="use-credentials" src={resolveAssetUrl(item.assetUrl)} alt={`${item.title}: ${item.description}`} loading="lazy" onError={() => setFailedImageKey(imageKey)}/> : <>
            <div className="visual-grid"/><Icon className="visual-icon" size={38}/>
            <span className="visual-type">{item.type === 'cctv' ? 'TRANSCRIPT · FICTIONAL' : item.type === 'image' ? (failedImageKey === imageKey ? 'ILLUSTRATIVE PLACEHOLDER · IMAGE COULD NOT LOAD' : item.assetStatus === 'failed' ? 'ILLUSTRATIVE PLACEHOLDER · IMAGE UNAVAILABLE' : 'ILLUSTRATIVE PLACEHOLDER') : item.type.toUpperCase()}</span>
          </>}
          <span className="exhibit-stamp">EXHIBIT {String(active + 1).padStart(2, '0')}</span><span className="visual-time">{item.timestamp}</span>
        </div><div className="exhibit-copy"><div className="exhibit-meta"><span>{item.type.toUpperCase()} EVIDENCE</span><span><Clock3 size={13}/>{item.timestamp}</span></div><h3>{item.title}</h3><p>{item.description}</p>
          {item.content?.messages && <div className="message-thread">{item.content.messages.map((message, index) => <div className={`message ${index % 2 ? 'message-right' : ''}`} key={`${message.sender}-${index}`}><span>{message.sender}</span><p>{message.text || message.content}</p><small>{message.timestamp}</small></div>)}</div>}
          {item.content?.statement && <blockquote>{item.content.statement}</blockquote>}
          {item.relatedSuspectIds?.length > 0 && <div className="related"><UserRound size={14}/> Connected to {item.relatedSuspectIds.map((id) => data.suspects.find((person) => person.id === id)?.name).filter(Boolean).join(', ')}</div>}
        </div></article>}
        <div className="evidence-footer"><span><span className="live-dot"/> ALL EXHIBITS ARE FICTIONAL</span><div><button disabled={active === 0} onClick={() => setActive(active - 1)}>PREVIOUS</button><span>{String(active + 1).padStart(2, '0')} / {String(evidence.length).padStart(2, '0')}</span><button disabled={active === evidence.length - 1} onClick={() => setActive(active + 1)}>NEXT <ArrowUpRight size={12}/></button></div></div>
      </section>
    </div>
  </main>;
}
