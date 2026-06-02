import { useState, useEffect, useRef, useCallback } from 'react';

const GUN_URL =
  'https://raw.githubusercontent.com/KeepDarker/dren-assets/main/scottishperson-sound-effect-machine-gun-333524.mp3';
const RADIO_URL =
  'https://raw.githubusercontent.com/KeepDarker/dren-assets/main/u_wxn5lzrjy3-military-radio-communication-222904.mp3';

const NARRATOR_SCRIPTS = [
  {
    en: "On paper, this individual was incinerated at Korhal's First Military Court three years ago. His name, his service record, even his medals — all erased from Dominion history.",
    ko: '기록상으로, 이 테란은 3년 전 코랄 제1군사법원에서 소각 처리되었습니다.\n이름도, 군적도, 그가 세운 훈장 기록도 전부 자치령 역사에서 지워졌죠.',
  },
  {
    en: "But the Dominion doesn't let the dead rest. Project ANATHEMA. A test subject for synthetic psionic agent development using terrazine and jorium. That was the real punishment hidden behind the expunged data.",
    ko: '하지만 자치령은 죽은 자를 가만히 두지 않았습니다. 프로젝트 아나테마.\n테라진과 조륨을 이용한 후천적 사이오닉 요원 개발의 피험체.\n그게 말소된 데이터 뒤에 숨겨진 진짜 형벌이었습니다.',
  },
  {
    en: 'Late 2502. Iron Cradle Station decommissioned. The Dominion attempted to purge the failures in a single nuclear strike, burying the survivors in the deepest abyss of New Folsom. The system deemed it a closed case. ...Until now.',
    ko: '2502년 말, 아이언 크래들 스테이션이 파괴되었습니다.\n자치령은 실패작들을 핵폭격으로 인멸하려 했고,\n생존자들은 뉴 폴섬의 가장 깊은 나락에 매장되었습니다.\n시스템은 완벽하게 끝났다고 판단했습니다. ……지금 이 순간 전까지는.',
  },
  {
    en: 'Biomechanical chip control lost. Guilt, ego, all burned away... leaving only monsters driven by pure aggression to dismantle the Dominion regime. And they are led by the most savage alpha of them all.',
    ko: '생체칩의 통제는 소실되었습니다. 죄책감도, 자아도 전부 타버린 채…\n오직 자치령의 체제를 무너뜨리겠다는 공격성만 남은 괴물들이 풀려났습니다.\n그것도 가장 흉폭한 우두머리의 손에.',
  },
];
const DREN_SCRIPT = {
  en: 'I will see you soon... my great Emperor Father.',
  ko: '곧 뵈러 가겠습니다… 위대한 황제 아버지시여.',
};
const GUARD_SCRIPT = {
  ko: '지하 4구역 격벽 파손! 억제장치가 작동하지 않습니다! 끄악—!',
};

// ── 오디오 ────────────────────────────────────────────────────────────────────
let _ctx = null;
function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
let _gunBuf = null,
  _radioBuf = null;

async function fetchAudioBuffer(url) {
  const ctx = getCtx();
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  return new Promise((resolve, reject) =>
    ctx.decodeAudioData(ab, resolve, reject)
  );
}

async function preloadAudio() {
  try {
    [_gunBuf, _radioBuf] = await Promise.all([
      fetchAudioBuffer(GUN_URL),
      fetchAudioBuffer(RADIO_URL),
    ]);
  } catch (e) {
    console.warn('Audio preload failed:', e);
  }
}

function makeAmbience() {
  const ctx = getCtx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2.5);
  [38, 42, 58, 78].forEach((f, i) => {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.value = 0.3 - i * 0.05;
    o.connect(g);
    g.connect(master);
    o.start();
  });
  const nBuf = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
  const nd = nBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.07;
  const ns = ctx.createBufferSource();
  ns.buffer = nBuf;
  ns.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 260;
  ns.connect(lp);
  lp.connect(master);
  ns.start();
  const lfo = ctx.createOscillator(),
    lfoG = ctx.createGain();
  lfo.frequency.value = 0.055;
  lfoG.gain.value = 0.03;
  lfo.connect(lfoG);
  lfoG.connect(master.gain);
  lfo.start();
  return () => {
    try {
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    } catch (e) {}
  };
}

function playDrenBeep(onEnd) {
  const ctx = getCtx();
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  const now = ctx.currentTime;
  const beeps = [
    { t: 0.0, dur: 0.2 },
    { t: 0.36, dur: 0.26 },
    { t: 0.78, dur: 0.42 },
    { t: 1.48, dur: 0.2 },
    { t: 1.8, dur: 0.26 },
    { t: 2.18, dur: 0.5 },
    { t: 2.85, dur: 0.46 },
  ];
  beeps.forEach(({ t, dur }) => {
    const bt = now + t;
    const osc = ctx.createOscillator(),
      oscG = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 195 + Math.random() * 18;
    oscG.gain.setValueAtTime(0, bt);
    oscG.gain.linearRampToValueAtTime(0.48, bt + 0.012);
    oscG.gain.setValueAtTime(0.48, bt + dur - 0.018);
    oscG.gain.linearRampToValueAtTime(0, bt + dur);
    const lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.value = 780;
    osc.connect(lp2);
    lp2.connect(oscG);
    oscG.connect(master);
    osc.start(bt);
    osc.stop(bt + dur + 0.01);
    const nLen = Math.floor(ctx.sampleRate * (dur + 0.04));
    const nBuf2 = ctx.createBuffer(1, nLen, ctx.sampleRate);
    const nd2 = nBuf2.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd2[i] = (Math.random() * 2 - 1) * 0.55;
    const noise = ctx.createBufferSource();
    noise.buffer = nBuf2;
    const nHP = ctx.createBiquadFilter();
    nHP.type = 'highpass';
    nHP.frequency.value = 1600;
    const nG = ctx.createGain();
    nG.gain.value = 0.16;
    noise.connect(nHP);
    nHP.connect(nG);
    nG.connect(master);
    noise.start(bt);
  });
  const total = beeps[beeps.length - 1].t + beeps[beeps.length - 1].dur + 0.35;
  master.gain.linearRampToValueAtTime(0, now + total);
  setTimeout(() => onEnd?.(), total * 1000 + 80);
}

let _scene3Sources = [];
let _scene3Masters = [];

function stopScene3Audio() {
  _scene3Sources.forEach((s) => {
    try {
      s.stop();
    } catch (e) {}
  });
  _scene3Masters.forEach((m) => {
    try {
      m.gain.linearRampToValueAtTime(0, getCtx().currentTime + 0.1);
    } catch (e) {}
  });
  _scene3Sources = [];
  _scene3Masters = [];
}

function playScene3(onSilence) {
  stopScene3Audio();
  const ctx = getCtx();
  const now = ctx.currentTime;

  const sMaster = ctx.createGain();
  sMaster.gain.value = 0;
  sMaster.connect(ctx.destination);
  _scene3Masters.push(sMaster);
  sMaster.gain.linearRampToValueAtTime(0.36, now + 0.12);
  sMaster.gain.setValueAtTime(0.36, now + 5.0);
  sMaster.gain.linearRampToValueAtTime(0, now + 6.0);
  const sLen = ctx.sampleRate * 7;
  const sBuf = ctx.createBuffer(1, sLen, ctx.sampleRate);
  const sd = sBuf.getChannelData(0);
  for (let i = 0; i < sLen; i++) {
    const b = Math.random() > 0.73 ? Math.random() * 0.85 + 0.25 : 0.05;
    sd[i] = (Math.random() * 2 - 1) * b;
  }
  const staticSrc = ctx.createBufferSource();
  staticSrc.buffer = sBuf;
  const sHP = ctx.createBiquadFilter();
  sHP.type = 'highpass';
  sHP.frequency.value = 2200;
  staticSrc.connect(sHP);
  sHP.connect(sMaster);
  staticSrc.start(now);
  _scene3Sources.push(staticSrc);

  const aMaster = ctx.createGain();
  aMaster.gain.value = 0.4;
  aMaster.connect(ctx.destination);
  _scene3Masters.push(aMaster);
  [0.05, 0.42, 0.79, 1.16, 1.52].forEach((off, i) => {
    const t = now + off;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 880 + (i % 2) * 220;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.018);
    g.gain.setValueAtTime(0.3, t + 0.14);
    g.gain.linearRampToValueAtTime(0, t + 0.2);
    o.connect(g);
    g.connect(aMaster);
    o.start(t);
    o.stop(t + 0.22);
  });

  if (_gunBuf) {
    const gM = ctx.createGain();
    gM.gain.value = 0.88;
    gM.connect(ctx.destination);
    _scene3Masters.push(gM);
    const gS = ctx.createBufferSource();
    gS.buffer = _gunBuf;
    gS.connect(gM);
    gS.start(now + 2.1);
    _scene3Sources.push(gS);
  }
  if (_radioBuf) {
    const rM = ctx.createGain();
    rM.gain.value = 0.75;
    rM.connect(ctx.destination);
    _scene3Masters.push(rM);
    const rHP = ctx.createBiquadFilter();
    rHP.type = 'highpass';
    rHP.frequency.value = 550;
    const rLP = ctx.createBiquadFilter();
    rLP.type = 'lowpass';
    rLP.frequency.value = 3600;
    const rS = ctx.createBufferSource();
    rS.buffer = _radioBuf;
    rS.connect(rHP);
    rHP.connect(rLP);
    rLP.connect(rM);
    rS.start(now + 1.9);
    _scene3Sources.push(rS);
  }

  const shockT = now + 6.2;
  const shM = ctx.createGain();
  shM.gain.value = 1.0;
  shM.connect(ctx.destination);
  _scene3Masters.push(shM);
  const boom = ctx.createOscillator(),
    boomG = ctx.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(95, shockT);
  boom.frequency.exponentialRampToValueAtTime(14, shockT + 0.9);
  boomG.gain.setValueAtTime(0, shockT);
  boomG.gain.linearRampToValueAtTime(1.5, shockT + 0.03);
  boomG.gain.exponentialRampToValueAtTime(0.001, shockT + 1.2);
  boom.connect(boomG);
  boomG.connect(shM);
  boom.start(shockT);
  boom.stop(shockT + 1.3);
  const sw = ctx.createOscillator(),
    swG = ctx.createGain();
  sw.type = 'sawtooth';
  sw.frequency.setValueAtTime(4500, shockT);
  sw.frequency.exponentialRampToValueAtTime(25, shockT + 0.6);
  swG.gain.setValueAtTime(0.7, shockT);
  swG.gain.exponentialRampToValueAtTime(0.001, shockT + 0.6);
  sw.connect(swG);
  swG.connect(shM);
  sw.start(shockT);
  sw.stop(shockT + 0.65);
  shM.gain.setValueAtTime(1.0, shockT + 0.04);
  shM.gain.linearRampToValueAtTime(0, shockT + 0.75);

  setTimeout(onSilence, (shockT - now + 0.85) * 1000);
}

// ── TTS ───────────────────────────────────────────────────────────────────────
function getMaleVoice() {
  const vs = window.speechSynthesis?.getVoices() || [];
  const names = [
    'Google UK English Male',
    'Microsoft David',
    'David',
    'Daniel',
    'Alex',
    'Fred',
    'Gordon',
    'Thomas',
    'Arthur',
  ];
  for (const n of names) {
    const v = vs.find((v) => v.name.includes(n) && v.lang.startsWith('en'));
    if (v) return v;
  }
  return (
    vs.find((v) => v.lang === 'en-GB') ||
    vs.find((v) => v.lang.startsWith('en')) ||
    null
  );
}
function speakNarrator(text, onEnd) {
  if (!window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.8;
  u.pitch = 0.45;
  u.volume = 1;
  const v = getMaleVoice();
  if (v) u.voice = v;
  u.onend = onEnd;
  u.onerror = onEnd;
  window.speechSynthesis.speak(u);
}

// ── 훅 ───────────────────────────────────────────────────────────────────────
const GLITCH = '▓▒░█▄▌▀!@#%&';
function useGlitchReveal(text, active, duration = 800) {
  const [out, setOut] = useState('');
  const raf = useRef(null);
  useEffect(() => {
    if (!active) {
      setOut('');
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const rev = Math.floor(p * text.length);
      let s = '';
      for (let i = 0; i < text.length; i++) {
        if (' \n'.includes(text[i])) {
          s += text[i];
          continue;
        }
        s +=
          i < rev ? text[i] : GLITCH[Math.floor(Math.random() * GLITCH.length)];
      }
      setOut(s);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setOut(text);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [active, text, duration]);
  return out;
}

function useTyping(text, active, speed = 32) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!active) {
      setOut('');
      setDone(false);
      return;
    }
    let i = 0;
    ref.current = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(ref.current);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(ref.current);
  }, [active, text, speed]);
  return { out, done };
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
function Subtitle({ sub }) {
  if (!sub) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 44,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 660,
        width: '92%',
        textAlign: 'center',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(3,6,12,0.9)',
          border: `1px solid ${
            sub.isDren
              ? 'rgba(160,185,210,0.3)'
              : sub.isGuard
              ? 'rgba(200,80,80,0.25)'
              : 'rgba(100,130,160,0.15)'
          }`,
          padding: '9px 22px',
          fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif",
          fontWeight: sub.isDren ? 600 : 400,
          fontSize: '13px',
          color: sub.isDren
            ? 'rgba(175,205,230,0.96)'
            : sub.isGuard
            ? 'rgba(220,150,140,0.92)'
            : 'rgba(155,178,200,0.88)',
          letterSpacing: '0.02em',
          lineHeight: 1.8,
          whiteSpace: 'pre-line',
        }}
      >
        {sub.text}
      </div>
    </div>
  );
}

function CRTNoise() {
  const c = useRef(null);
  useEffect(() => {
    const canvas = c.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() > 0.987 ? 165 : 0;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = v ? 35 : 0;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={c}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}

function DataLine({ label, value, visible, delay = 0, critical = false }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [visible, delay]);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px solid rgba(150,170,200,0.09)',
        opacity: show ? 1 : 0,
        transform: show ? 'none' : 'translateX(-8px)',
        transition: 'opacity 0.4s,transform 0.4s',
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: '11px',
        letterSpacing: '0.07em',
      }}
    >
      <span style={{ color: '#5a6a7a', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span
        style={{
          color: critical ? '#9ab0c8' : '#6a8a9a',
          fontWeight: critical ? 'bold' : 'normal',
          letterSpacing: '0.12em',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Scene1({ active, onDone, setSub }) {
  const [p, setP] = useState(0);
  const title = useGlitchReveal('CLASSIFIED', active, 900);
  const casenum = useGlitchReveal(
    'CASE NO. 2501-DOM-0317',
    active && p >= 1,
    700
  );
  useEffect(() => {
    if (!active) {
      setP(0);
      return;
    }
    const t1 = setTimeout(() => setP(1), 1100);
    const t2 = setTimeout(() => setP(2), 2000);
    const t3 = setTimeout(() => setP(3), 2700);
    const t4 = setTimeout(() => {
      setSub({ text: NARRATOR_SCRIPTS[0].ko });
      speakNarrator(NARRATOR_SCRIPTS[0].en, () => {
        setSub(null);
        setTimeout(onDone, 600);
      });
    }, 2900);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [active]);
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        padding: '0 40px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: 44,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.6s',
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(52px,10vw,80px)',
            letterSpacing: '0.22em',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(140,170,200,0.55)',
            lineHeight: 1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: '11px',
            letterSpacing: '0.3em',
            color: '#3a4a5a',
            marginTop: 10,
            opacity: p >= 1 ? 1 : 0,
            transition: 'opacity 0.5s',
          }}
        >
          {casenum}
        </div>
      </div>
      <div
        style={{
          opacity: p >= 2 ? 1 : 0,
          transform: p >= 2 ? 'none' : 'translateY(10px)',
          transition: 'opacity 0.5s,transform 0.5s',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: '10px',
            color: '#3a4a5a',
            letterSpacing: '0.22em',
            marginBottom: 8,
          }}
        >
          SUBJECT IDENTITY
        </div>
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(36px,7vw,54px)',
            letterSpacing: '0.12em',
            color: '#8aa4b8',
            lineHeight: 1,
          }}
        >
          DREN HARKE
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: '11px',
            color: '#3a4a5a',
            letterSpacing: '0.15em',
            marginTop: 6,
          }}
        >
          FORMER CONFEDERATE AIR FORCE · 2ND LIEUTENANT
          <span
            style={{
              background: '#1a2530',
              color: '#1a2530',
              marginLeft: 10,
              padding: '0 2px',
              fontSize: 12,
            }}
          >
            ██████████
          </span>
        </div>
      </div>
      <div style={{ opacity: p >= 3 ? 1 : 0, transition: 'opacity 0.4s' }}>
        <DataLine
          label="Official status"
          value="EXECUTED · 2501.02.06"
          visible={p >= 3}
          delay={0}
        />
        <DataLine
          label="Records"
          value="PERMANENTLY EXPUNGED"
          visible={p >= 3}
          delay={150}
        />
        <DataLine
          label="Service medals"
          value="CLASSIFIED ██████"
          visible={p >= 3}
          delay={300}
        />
        <DataLine
          label="Next of kin"
          value="NOTIFIED / REDACTED"
          visible={p >= 3}
          delay={450}
        />
      </div>
    </div>
  );
}

function Scene2({ active, onDone, setSub }) {
  const [p, setP] = useState(0);
  const proj = useGlitchReveal('PROJECT: ANATHEMA', active, 800);
  useEffect(() => {
    if (!active) {
      setP(0);
      return;
    }
    const t1 = setTimeout(() => setP(1), 500);
    const t2 = setTimeout(() => setP(2), 1300);
    const t3 = setTimeout(() => {
      setSub({ text: NARRATOR_SCRIPTS[1].ko });
      speakNarrator(NARRATOR_SCRIPTS[1].en, () => {
        setSub({ text: NARRATOR_SCRIPTS[2].ko });
        speakNarrator(NARRATOR_SCRIPTS[2].en, () => {
          setSub(null);
          setTimeout(onDone, 600);
        });
      });
    }, 700);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [active]);
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        padding: '0 40px',
      }}
    >
      <div
        style={{
          opacity: active ? 1 : 0,
          transition: 'opacity 0.5s',
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(28px,5vw,40px)',
            letterSpacing: '0.18em',
            color: 'rgba(140,170,200,0.5)',
            WebkitTextStroke: '0.5px rgba(140,170,200,0.45)',
          }}
        >
          {proj}
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: '10px',
            color: '#3a4a5a',
            letterSpacing: '0.22em',
            marginTop: 6,
          }}
        >
          SYNTHETIC PSIONIC AGENT DEVELOPMENT PROGRAM
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <DataLine
          label="Program class"
          value="SPECTRE · TIER-1 BLACK"
          visible={active}
          delay={200}
          critical
        />
        <DataLine
          label="Enhancement"
          value="TERRAZINE + JORIUM"
          visible={active}
          delay={350}
        />
        <DataLine
          label="Subject count"
          value="██ / ██ SURVIVED"
          visible={active}
          delay={500}
        />
        <DataLine
          label="Facility"
          value="IRON CRADLE STATION"
          visible={active}
          delay={650}
        />
        <DataLine
          label="Station status"
          value="NUCLEAR STRIKE · 2502.11"
          visible={active}
          delay={800}
        />
        <DataLine
          label="Survivors"
          value="NEW FOLSOM · SUBLEVEL 9"
          visible={active}
          delay={950}
        />
      </div>
      <div
        style={{
          opacity: p >= 2 ? 1 : 0,
          transition: 'opacity 0.5s',
          border: '1px solid rgba(180,30,30,0.25)',
          padding: '12px 16px',
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '11px',
          letterSpacing: '0.12em',
          color: 'rgba(180,100,100,0.7)',
        }}
      >
        <span
          style={{ animation: 'blink 0.9s step-end infinite', marginRight: 8 }}
        >
          ▎
        </span>
        PROJECT ANATHEMA DENIED · FACILITY TERMINATION ORDER ISSUED
      </div>
    </div>
  );
}

function Scene3({ active, onDone, setSub }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) {
      setP(0);
      return;
    }
    const t1 = setTimeout(() => {
      setP(1);
      playScene3(() => setP(3));
    }, 200);
    const t2 = setTimeout(() => setP(2), 900);
    const t3 = setTimeout(
      () => setSub({ text: GUARD_SCRIPT.ko, isGuard: true }),
      1900
    );
    const t4 = setTimeout(() => setSub(null), 4500);
    const t5 = setTimeout(() => setP(4), 7000);
    const t6 = setTimeout(() => setP(5), 8100);
    const t7 = setTimeout(onDone, 10500);
    return () => {
      [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
      stopScene3Audio();
    };
  }, [active]);
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        padding: '0 40px',
      }}
    >
      <div
        style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '10px',
          letterSpacing: '0.22em',
          marginBottom: 16,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.3s',
          color: p >= 1 && p < 3 ? 'rgba(215,60,60,0.9)' : '#3a4a5a',
          animation: p >= 1 && p < 3 ? 'blink 0.38s step-end infinite' : 'none',
        }}
      >
        {p >= 1
          ? '⚠ SECURITY ALERT · NEW FOLSOM · SUBLEVEL 4'
          : 'NEW FOLSOM PENITENTIARY · SUBLEVEL 9 · CCTV FEED'}
      </div>
      <div
        style={{
          position: 'relative',
          border: '1px solid rgba(150,170,200,0.1)',
          padding: '18px 20px',
          marginBottom: 24,
          overflow: 'hidden',
          opacity: p >= 1 ? 1 : 0,
          transition: 'opacity 0.4s',
          minHeight: 155,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: '9px',
            letterSpacing: '0.15em',
            color: p >= 3 ? 'rgba(55,75,88,0.6)' : 'rgba(205,45,45,0.8)',
            animation:
              p >= 1 && p < 3 ? 'blink 0.9s step-end infinite' : 'none',
          }}
        >
          ● {p >= 3 ? 'SIGNAL LOST' : 'REC 04:17:33'}
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: '11px',
            lineHeight: 2.15,
            letterSpacing: '0.07em',
          }}
        >
          <div
            style={{
              opacity: p >= 1 ? 1 : 0,
              transition: 'opacity 0.15s',
              color: 'rgba(215,70,70,0.92)',
            }}
          >
            [ALERT] SUBLEVEL-4 BULKHEAD BREACH DETECTED
          </div>
          <div
            style={{
              opacity: p >= 1 ? 1 : 0,
              transition: 'opacity 0.15s 0.14s',
              color: 'rgba(215,70,70,0.92)',
            }}
          >
            [ALERT] INHIBITOR ARRAY · NON-RESPONSIVE
          </div>
          <div
            style={{
              opacity: p >= 2 ? 1 : 0,
              transition: 'opacity 0.2s',
              color: '#4a5e6e',
            }}
          >
            [COMM] "Bulkhead compromised in Sector 4! Suppression fields are
            down! God, he's—"
          </div>
          <div
            style={{
              opacity: p >= 2 ? 1 : 0,
              transition: 'opacity 0.2s 0.12s',
              color: '#2e3d48',
              letterSpacing: '0.15em',
            }}
          >
            [COMM] ████ [STATIC / SCREAM]
          </div>
          <div
            style={{
              opacity: p >= 3 ? 1 : 0,
              transition: 'opacity 0.55s',
              color: '#1e2c35',
              letterSpacing: '0.3em',
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            — — — SIGNAL TERMINATED — — —
          </div>
        </div>
      </div>
      <div
        style={{
          opacity: p >= 4 ? 1 : 0,
          transition: 'opacity 0.9s',
          border: '1px solid rgba(150,170,200,0.07)',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(5,9,15,0.75)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.13) 2px,rgba(0,0,0,0.13) 3px)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: '9px',
            color: '#243040',
            letterSpacing: '0.2em',
            marginBottom: 14,
          }}
        >
          CAM-09 · SUBLEVEL-4 CONTROL ROOM · 04:17:51
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: '11px',
            color: '#3a5060',
            lineHeight: 2,
            letterSpacing: '0.07em',
            marginBottom: 16,
          }}
        >
          <span style={{ color: 'rgba(140,165,185,0.28)' }}>[VISUAL]</span>{' '}
          Mechanical prosthetic arm — terminal ripped from mount.
          <br />
          <span style={{ paddingLeft: 12, color: 'rgba(200,150,60,0.35)' }}>
            Electrical discharge: multiple contact points.
          </span>
        </div>
        <div
          style={{
            opacity: p >= 5 ? 1 : 0,
            transition: 'opacity 1.3s',
            textAlign: 'center',
            padding: '14px 0 6px',
            borderTop: '1px solid rgba(150,170,200,0.05)',
          }}
        >
          <svg
            width="88"
            height="88"
            viewBox="0 0 88 88"
            style={{ marginBottom: 10, opacity: 0.48 }}
          >
            <ellipse
              cx="44"
              cy="37"
              rx="23"
              ry="27"
              fill="none"
              stroke="rgba(125,160,192,0.28)"
              strokeWidth="1"
            />
            <path
              d="M23 50 Q44 69 65 50"
              fill="none"
              stroke="rgba(125,160,192,0.2)"
              strokeWidth="1"
            />
            <ellipse
              cx="35"
              cy="35"
              rx="5"
              ry="3"
              fill="rgba(125,182,212,0.09)"
              stroke="rgba(125,188,220,0.55)"
              strokeWidth="0.8"
            />
            <ellipse
              cx="53"
              cy="35"
              rx="5"
              ry="3"
              fill="rgba(125,182,212,0.09)"
              stroke="rgba(125,188,220,0.55)"
              strokeWidth="0.8"
            />
            <ellipse
              cx="35"
              cy="35"
              rx="2"
              ry="1.4"
              fill="rgba(145,208,238,0.68)"
            />
            <ellipse
              cx="53"
              cy="35"
              rx="2"
              ry="1.4"
              fill="rgba(145,208,238,0.68)"
            />
            <line
              x1="28"
              y1="46"
              x2="60"
              y2="46"
              stroke="rgba(125,160,192,0.18)"
              strokeWidth="0.8"
            />
            <line
              x1="37"
              y1="46"
              x2="37"
              y2="56"
              stroke="rgba(125,160,192,0.13)"
              strokeWidth="0.7"
            />
            <line
              x1="51"
              y1="46"
              x2="51"
              y2="56"
              stroke="rgba(125,160,192,0.13)"
              strokeWidth="0.7"
            />
            <circle
              cx="44"
              cy="44"
              r="37"
              fill="none"
              stroke="rgba(125,160,192,0.07)"
              strokeWidth="0.5"
              strokeDasharray="3 7"
            />
            <line
              x1="7"
              y1="44"
              x2="81"
              y2="44"
              stroke="rgba(125,160,192,0.07)"
              strokeWidth="0.5"
            />
            <line
              x1="44"
              y1="7"
              x2="44"
              y2="81"
              stroke="rgba(125,160,192,0.07)"
              strokeWidth="0.5"
            />
          </svg>
          <div
            style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: '9px',
              color: '#2d3e4a',
              letterSpacing: '0.22em',
            }}
          >
            TARGET ACQUIRED · AFFECT: NONE · STATE: LETHAL
          </div>
        </div>
      </div>
    </div>
  );
}

function Scene4({ active, onDone, setSub }) {
  const [p, setP] = useState(0);
  const { out: narr, done: narrDone } = useTyping(
    NARRATOR_SCRIPTS[3].en,
    active && p >= 1,
    30
  );
  const { out: dren, done: drenDone } = useTyping(
    DREN_SCRIPT.en,
    active && p >= 3,
    62
  );
  useEffect(() => {
    if (!active) {
      setP(0);
      return;
    }
    stopScene3Audio();
    const t1 = setTimeout(() => setP(1), 400);
    const t2 = setTimeout(() => {
      setSub({ text: NARRATOR_SCRIPTS[3].ko });
      speakNarrator(NARRATOR_SCRIPTS[3].en, () => {
        setSub(null);
        setTimeout(() => setP(3), 500);
      });
    }, 600);
    return () => [t1, t2].forEach(clearTimeout);
  }, [active]);
  useEffect(() => {
    if (p === 3 && active) {
      const t = setTimeout(() => {
        setP(4);
        setSub({ text: DREN_SCRIPT.ko, isDren: true });
        playDrenBeep(() => {
          setSub(null);
          setTimeout(onDone, 900);
        });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [p, active]);
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        padding: '0 40px',
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <DataLine
          label="Threat classification"
          value="CRITICAL · UNMEASURABLE"
          visible={active}
          delay={0}
          critical
        />
        <DataLine
          label="Biochip control"
          value="SIGNAL LOST"
          visible={active}
          delay={150}
          critical
        />
        <DataLine
          label="Current location"
          value="UNKNOWN"
          visible={active}
          delay={300}
          critical
        />
        <DataLine
          label="Projected target"
          value="KORHAL · DOMINION CAPITAL"
          visible={active}
          delay={450}
          critical
        />
        <DataLine
          label="Psionics index"
          value="███████ / OFF SCALE"
          visible={active}
          delay={600}
          critical
        />
      </div>
      <div
        style={{
          opacity: p >= 1 ? 1 : 0,
          transition: 'opacity 0.4s',
          marginBottom: 32,
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '12px',
          lineHeight: 1.9,
          color: '#5a6a7a',
          letterSpacing: '0.05em',
          minHeight: 80,
        }}
      >
        {narr}
        {!narrDone && p >= 1 && (
          <span style={{ animation: 'blink 0.7s step-end infinite' }}>_</span>
        )}
      </div>
      {p >= 3 && (
        <div
          style={{
            borderLeft: '2px solid rgba(140,170,200,0.2)',
            paddingLeft: 20,
            marginTop: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: '9px',
              color: '#3a4a5a',
              letterSpacing: '0.22em',
              marginBottom: 10,
            }}
          >
            INTERCEPTED TRANSMISSION · DREN HARKE · COMM OVERRIDE
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani',sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(16px,3vw,22px)',
              letterSpacing: '0.08em',
              color: 'rgba(160,185,210,0.93)',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            "{dren}
            {!drenDone && (
              <span
                style={{
                  animation: 'blink 0.7s step-end infinite',
                  fontStyle: 'normal',
                }}
              >
                _
              </span>
            )}
            {drenDone && '"'}
          </div>
        </div>
      )}
    </div>
  );
}

function Outro({ active }) {
  const [show, setShow] = useState(false);
  const title = useGlitchReveal('DREN HARKE', active, 1200);
  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), 1000);
    return () => clearTimeout(t);
  }, [active]);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '0 40px',
        opacity: active ? 1 : 0,
        transition: 'opacity 1s',
      }}
    >
      <div
        style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '10px',
          color: '#3a4a5a',
          letterSpacing: '0.35em',
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        TERRAN DOMINION · INTELLIGENCE COMMAND
      </div>
      <div
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 'clamp(48px,9vw,72px)',
          letterSpacing: '0.2em',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(140,170,200,0.4)',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '10px',
          letterSpacing: '0.25em',
          color: '#2a3a4a',
          marginTop: 16,
          textAlign: 'center',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.8s',
        }}
      >
        ACTIVE · UNCONTROLLED · INBOUND
      </div>
    </div>
  );
}

export default function App() {
  const [scene, setScene] = useState(-1);
  const [started, setStarted] = useState(false);
  const [fade, setFade] = useState(false);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const stopAmbience = useRef(null);

  const transitionTo = useCallback((next) => {
    setFade(true);
    setTimeout(() => {
      setScene(next);
      setFade(false);
    }, 600);
  }, []);

  const start = async () => {
    setLoading(true);
    getCtx();
    window.speechSynthesis?.getVoices();
    await preloadAudio();
    stopAmbience.current = makeAmbience();
    setLoading(false);
    setStarted(true);
    setTimeout(() => transitionTo(0), 300);
  };

  const replay = () => {
    window.speechSynthesis?.cancel();
    stopAmbience.current?.();
    setSub(null);
    setFade(true);
    setTimeout(() => {
      setScene(-1);
      setStarted(false);
      setFade(false);
    }, 700);
  };

  const sp = (idx: number): any => ({
    active: scene === idx && !fade,
    onDone: () => setTimeout(() => transitionTo(idx + 1), 700),
    setSub,
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060a0e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Share Tech Mono',monospace",
        userSelect: 'none',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&family=Rajdhani:wght@700&family=Noto+Sans+KR:wght@400;600&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing: border-box; }
      `}</style>
      <CRTNoise />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)',
          pointerEvents: 'none',
          zIndex: 9,
        }}
      />
      {([
  [{ top: 28, left: 28 }, '1px 0 0 1px'],
  [{ top: 28, right: 28 }, '1px 1px 0 0'],
  [{ bottom: 28, left: 28 }, '0 0 1px 1px'],
  [{ bottom: 28, right: 28 }, '0 1px 1px 0'],
] as [React.CSSProperties, string][]).map(([pos, bw], i) => (
  <div
    key={i}
    style={{
      position: 'absolute',
      ...pos,
      width: 20,
      height: 20,
      borderStyle: 'solid',
      borderColor: 'rgba(140,170,200,0.13)',
      borderWidth: bw,
      pointerEvents: 'none',
    }}
  />
      ))}
      <div
        style={{
          position: 'absolute',
          top: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '9px',
          color: '#2a3a4a',
          letterSpacing: '0.3em',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        TER·INT·CMD // ACCESS LEVEL 5 // {started ? 'FEED ACTIVE' : 'STANDBY'}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '9px',
          color: '#2a3a4a',
          letterSpacing: '0.25em',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {scene >= 0 && scene <= 4 ? `SCENE ${scene + 1} / 5` : '——'}
      </div>
      <Subtitle sub={sub} />
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          opacity: fade ? 0 : 1,
          transition: 'opacity 0.55s ease',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {!started && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 1s ease' }}>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 'clamp(12px,2vw,14px)',
                letterSpacing: '0.5em',
                color: '#2a3a4a',
                marginBottom: 40,
              }}
            >
              TERRAN DOMINION · INTELLIGENCE COMMAND
            </div>
            <button
              onClick={start}
              disabled={loading}
              style={{
                background: 'transparent',
                border: '1px solid rgba(140,170,200,0.2)',
                color: loading ? '#3a4a5a' : 'rgba(140,170,200,0.5)',
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: '11px',
                letterSpacing: '0.3em',
                padding: '12px 32px',
                cursor: loading ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.target as HTMLElement).style.borderColor = 'rgba(140,170,200,0.5)';
                  (e.target as HTMLElement).style.borderColor = 'rgba(140,170,200,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.borderColor = 'rgba(140,170,200,0.2)';
                (e.target as HTMLElement).style.borderColor = 'rgba(140,170,200,0.5)';
              }}
            >
              {loading ? '[ LOADING... ]' : '[ INITIATE PLAYBACK ]'}
            </button>
          </div>
        )}
        {scene === 0 && <Scene1 {...sp(0)} />}
        {scene === 1 && <Scene2 {...sp(1)} />}
        {scene === 2 && (
          <Scene3
            active={scene === 2 && !fade}
            onDone={() => setTimeout(() => transitionTo(3), 700)}
            setSub={setSub}
          />
        )}
        {scene === 3 && <Scene4 {...sp(3)} />}
        {scene === 4 && <Outro active={!fade} />}
        {scene >= 4 && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 48,
              opacity: scene === 4 && !fade ? 1 : 0,
              transition: 'opacity 1s 1.5s',
            }}
          >
            <button onClick={replay}
  style={{ background: "transparent", border: "1px solid rgba(140,170,200,0.15)", color: "rgba(140,170,200,0.3)", fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "0.25em", padding: "8px 20px", cursor: "pointer", transition: "all 0.2s" }}
  onMouseEnter={e => { (e.target as HTMLElement).style.color = "rgba(140,170,200,0.6)"; (e.target as HTMLElement).style.borderColor = "rgba(140,170,200,0.4)"; }}
  onMouseLeave={e => { (e.target as HTMLElement).style.color = "rgba(140,170,200,0.3)"; (e.target as HTMLElement).style.borderColor = "rgba(140,170,200,0.15)"; }}>
  [ REPLAY ]
</button>
          </div>
        )}
      </div>
    </div>
  );
}
