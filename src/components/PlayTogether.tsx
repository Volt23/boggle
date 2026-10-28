import { useEffect, useRef, useState } from 'react';
import { Check, Link2, LogIn } from 'lucide-react';
import { CODE_LENGTH, normalizeCode } from '../utils/boardCode';

interface PlayTogetherProps {
  code: string;
  onJoin: (code: string) => void;
}

/** Same code, same board: friends deal identical boards without any server. */
export function PlayTogether({ code, onJoin }: PlayTogetherProps) {
  const [input, setInput] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copiedTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeCode(input);
    if (!normalized) {
      setInvalid(true);
      return;
    }
    setInput('');
    onJoin(normalized);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setCopied(true);
        window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
      },
      () => setCopyFailed(true), // clipboard blocked: show the link to copy by hand
    );
  };

  return (
    <section className="space-y-3 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10" aria-labelledby="together-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="together-title" className="font-display text-lg font-semibold">
            Play together
          </h2>
          <p className="text-sm text-white/60">Everyone with the same code gets the same board.</p>
        </div>
        {code && (
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {copied ? <Check size={16} className="text-emerald-300" /> : <Link2 size={16} />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        )}
      </div>

      <form onSubmit={join} className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Board code</span>
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setInvalid(false);
            }}
            placeholder="Enter a friend's code"
            maxLength={CODE_LENGTH + 2}
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid}
            className="w-full rounded-xl bg-white/10 px-3 py-2.5 font-mono uppercase tracking-widest text-white ring-1 ring-white/10 transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-amber-300 aria-[invalid=true]:ring-rose-400"
          />
        </label>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 font-medium ring-1 ring-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <LogIn size={16} /> Join
        </button>
      </form>
      {copyFailed && (
        <p className="select-all break-all rounded-xl bg-black/30 px-3 py-2 font-mono text-xs text-white/80">
          {window.location.href}
        </p>
      )}
      {invalid && (
        <p className="text-sm text-rose-300" role="alert">
          Codes are {CODE_LENGTH} letters and digits, like the one in the top corner.
        </p>
      )}
    </section>
  );
}
