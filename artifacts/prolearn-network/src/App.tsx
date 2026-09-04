import { Fragment, type FormEvent, type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowRight, Award, Bell, BookOpen, Check, ChevronDown, Clock3,
  Compass, FileText, Flame, Heart, Home as HomeIcon,
  Lightbulb, LogOut, MessageCircle, Moon, MoreHorizontal, Pencil, Play,
  Plus, Search, Settings as SettingsIcon, Share2, Sparkles, Sun, Target, ThumbsUp,
  TrendingUp, UserRound, Users, X, Zap, BarChart3, CheckCircle2, ClipboardCheck,
  GraduationCap, ShieldCheck, Upload, Layers3, SlidersHorizontal, UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Link, Route, Switch, useLocation, useParams, Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type Course = {
  id: string; title: string; category: string; level: string; duration: string; lessons: number;
  progress: number; description: string; trainer: string; initials: string; color: string;
  accent: string; enrolled?: boolean; skills: string[]; status?: string;
};
type Post = { id: number; name: string; role: string; initials: string; time: string; body: string; tags: string[]; likes: number; comments: number; liked?: boolean; };
type Notice = { id: number; type: 'course' | 'network' | 'achievement' | 'assessment'; title: string; body: string; time: string; read: boolean; };
type Role = 'TRAINEE' | 'TRAINER' | 'ADMIN';
type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
type AuthUser = {
  id: string; email: string; name: string; role: Role; status: AccountStatus;
  location: string; bio: string; skills: string[]; emailVerified: boolean;
};
type TrainerApplication = AuthUser & { createdAt: string; updatedAt: string };
type LearningActivitySummary = {
  id: string; action: string; title: string; date: string; durationMinutes: number;
};
type LearningSummary = {
  streak: number; overallProgress: number; weeklyMinutes: number;
  weeklyActivity: number[]; enrolledCourses: Course[]; activities: LearningActivitySummary[];
};

const courses: Course[] = [
  { id: 'product-storytelling', title: 'Product storytelling for people who build', category: 'Communication', level: 'Intermediate', duration: '4h 20m', lessons: 12, progress: 68, description: 'Make complex work easy to understand, memorable to champion, and impossible to overlook.', trainer: 'Maya Okafor', initials: 'MO', color: '#174f4d', accent: '#f28d72', skills: ['Narrative design', 'Presenting', 'Stakeholder influence'] },
  { id: 'data-decisions', title: 'Data-informed decisions', category: 'Strategy', level: 'Intermediate', duration: '3h 45m', lessons: 10, progress: 24, description: 'Turn messy signals into clear choices with a practical toolkit for confident decisions.', trainer: 'Jon Bell', initials: 'JB', color: '#65543d', accent: '#d8ba76', skills: ['Critical thinking', 'Metrics', 'Decision making'] },
  { id: 'lead-without-title', title: 'Lead without the title', category: 'Leadership', level: 'Beginner', duration: '5h 10m', lessons: 15, progress: 0, description: 'Build trust, move work forward, and become the person teams look to when the path is unclear.', trainer: 'Amara Wright', initials: 'AW', color: '#334c65', accent: '#d5a997', skills: ['Influence', 'Feedback', 'Collaboration'] },
  { id: 'systems-for-focus', title: 'Systems for focused work', category: 'Productivity', level: 'Beginner', duration: '2h 30m', lessons: 8, progress: 0, description: 'A humane operating system for protecting attention and finishing the work that matters.', trainer: 'Theo Marsh', initials: 'TM', color: '#6c485e', accent: '#dca4a9', skills: ['Focus', 'Planning', 'Energy management'] },
  { id: 'career-portfolio', title: 'Build a career portfolio that travels', category: 'Career craft', level: 'Advanced', duration: '6h 05m', lessons: 18, progress: 0, description: 'Collect your proof of work into a portfolio that opens conversations before you enter the room.', trainer: 'Nia Carter', initials: 'NC', color: '#2f5a4f', accent: '#ddb66e', skills: ['Personal brand', 'Portfolio', 'Career strategy'] },
  { id: 'feedback-loops', title: 'The useful feedback loop', category: 'Communication', level: 'Intermediate', duration: '2h 15m', lessons: 7, progress: 0, description: 'Give and receive feedback that makes the next version better — without making it personal.', trainer: 'Samir Shah', initials: 'SS', color: '#5b536b', accent: '#e5a477', skills: ['Feedback', 'Coaching', 'Self-awareness'] },
  { id: 'sql-intermediate', title: 'SQL for data analysis', category: 'Data analytics', level: 'Intermediate', duration: '3h 20m', lessons: 9, progress: 0, description: 'Query, join, and shape the data behind confident business decisions.', trainer: 'Aarav Mehta', initials: 'AM', color: '#1f5a59', accent: '#e7a27d', skills: ['SQL', 'Data analysis', 'Query design'] },
  { id: 'statistics-foundations', title: 'Statistics without the fog', category: 'Data analytics', level: 'Beginner', duration: '2h 45m', lessons: 8, progress: 0, description: 'Make sense of variance, distributions, and the numbers behind a useful insight.', trainer: 'Nadia Okoro', initials: 'NO', color: '#5d5037', accent: '#d8ba76', skills: ['Statistics', 'Critical thinking', 'Data literacy'] },
  { id: 'power-bi-storytelling', title: 'Power BI for clear stories', category: 'Data analytics', level: 'Intermediate', duration: '4h 10m', lessons: 11, progress: 0, description: 'Turn raw analysis into dashboards that help people decide what to do next.', trainer: 'Ravi Nair', initials: 'RN', color: '#374e64', accent: '#d5a997', skills: ['Power BI', 'Visualization', 'Communication'] },
];

const initialPosts: Post[] = [
  { id: 1, name: 'Leila Mensah', role: 'Product designer · Accra', initials: 'LM', time: '18 min ago', body: 'I used to think a portfolio was an archive. This week I rewrote mine as a point of view — three decisions, three trade-offs, and what changed because I was there.', tags: ['#career-craft', '#portfolio'], likes: 42, comments: 8 },
  { id: 2, name: 'Ravi Nair', role: 'Operations lead · Bengaluru', initials: 'RN', time: '2 hr ago', body: 'Small learning win: I ran my first customer interview without a script. The pauses were uncomfortable, then incredibly useful. Listening is a skill you can practice.', tags: ['#fieldnotes'], likes: 27, comments: 4 },
  { id: 3, name: 'Clara Sato', role: 'Data analyst · Vancouver', initials: 'CS', time: 'Yesterday', body: 'A question I am carrying from this week’s decision-making module: which number would change your mind? It is becoming my favorite way to start a review.', tags: ['#learning-in-public', '#decisions'], likes: 19, comments: 3 },
];
const initialNotices: Notice[] = [
  { id: 1, type: 'assessment', title: 'Assessment due tomorrow', body: 'Your Product storytelling checkpoint is ready when you are.', time: '12 min ago', read: false },
  { id: 2, type: 'network', title: 'Leila Mensah liked your progress note', body: 'Your post about narrative design is getting noticed.', time: '2 hr ago', read: false },
  { id: 3, type: 'achievement', title: 'You kept a 5 day learning streak', body: 'Consistency is becoming part of your reputation.', time: 'Yesterday', read: false },
  { id: 4, type: 'course', title: 'A new resource was added', body: 'Maya added “The three-line brief” to Product storytelling.', time: 'Tue', read: true },
  { id: 5, type: 'network', title: 'You have 3 new people to meet', body: 'Your network is growing around communication and strategy.', time: 'Mon', read: true },
];
const roleCopy: Record<Role, { label: string; description: string }> = {
  TRAINEE: { label: 'Trainee', description: 'Learn & grow' },
  TRAINER: { label: 'Trainer', description: 'Teach & manage' },
  ADMIN: { label: 'Admin', description: 'Control & monitor' },
};
const competencySubjects = ['Python Programming', 'Data Analytics', 'Leadership', 'Project Management'];
const trainerMatches = [
  { name: 'Aarav Mehta', initials: 'AM', role: 'Senior data engineer · Bengaluru', score: 92, experience: '6 years', skills: ['Python', 'Django', 'Machine Learning'], certifications: 3, performance: '4.9 / 5' },
  { name: 'Nadia Okoro', initials: 'NO', role: 'Analytics lead · London', score: 84, experience: '4 years', skills: ['Python', 'SQL', 'Data Analysis'], certifications: 2, performance: '4.7 / 5' },
  { name: 'Ravi Nair', initials: 'RN', role: 'Operations lead · Bengaluru', score: 68, experience: '2 years', skills: ['Python', 'Reporting'], certifications: 1, performance: '4.4 / 5' },
];
const personalizedSteps = [
  { courseId: 'sql-intermediate', title: 'SQL for data analysis', category: 'Close the biggest gap', duration: '3h 20m', description: 'Query, join, and shape the data behind confident business decisions.', reason: 'Your SQL signal is at 40%, below the Data Analyst target.' },
  { courseId: 'statistics-foundations', title: 'Statistics without the fog', category: 'Build a durable foundation', duration: '2h 45m', description: 'Make sense of variance, distributions, and the numbers behind a useful insight.', reason: 'A stronger statistics foundation will make your analysis more reliable.' },
  { courseId: 'power-bi-storytelling', title: 'Power BI for clear stories', category: 'Make the work visible', duration: '4h 10m', description: 'Turn raw analysis into dashboards that help people decide what to do next.', reason: 'Power BI is the furthest skill from your target role at 20%.' },
];
const traineeSkills = [
  { skill: 'Excel', current: 92, target: 80, status: 'Strength' },
  { skill: 'Python', current: 80, target: 80, status: 'On target' },
  { skill: 'Data analysis', current: 74, target: 85, status: 'Nearly there' },
  { skill: 'SQL', current: 40, target: 80, status: 'Gap' },
  { skill: 'Statistics', current: 50, target: 78, status: 'Gap' },
  { skill: 'Power BI', current: 20, target: 72, status: 'Priority gap' },
];
const passportSkills = [
  { name: 'Python', level: 'Advanced', score: 80 },
  { name: 'Data analysis', level: 'Advanced', score: 74 },
  { name: 'Excel', level: 'Advanced', score: 92 },
  { name: 'SQL', level: 'Developing', score: 40 },
];
const certificates = [
  { title: 'Product storytelling', issued: '03 Sep 2026', id: 'CC-2026-001248' },
  { title: 'Foundations of facilitation', issued: '18 Aug 2026', id: 'CC-2026-001109' },
];

type AppContextValue = {
  theme: 'light' | 'dark'; toggleTheme: () => void;
  accessibilityMode: boolean; toggleAccessibility: () => void;
  user: AuthUser | null; authLoading: boolean;
  role: Role; signIn: (email: string, password: string, admin?: boolean) => Promise<AuthUser>;
  signUp: (values: { email: string; password: string; name: string; role: Exclude<Role, 'ADMIN'> }) => Promise<{ message: string; needsEmailVerification?: boolean; status?: AccountStatus }>;
  signOut: () => Promise<void>;
  courseCatalog: Course[]; learningSummary: LearningSummary; learningLoading: boolean;
  globalSearch: string; setGlobalSearch: (value: string) => void;
  enrolled: string[]; enroll: (id: string) => Promise<void>; advance: (id: string) => Promise<void>; progressFor: (id: string) => number;
  posts: Post[]; react: (id: number) => void; follow: (name: string) => void; following: string[];
  publish: (body: string) => void;
  notices: Notice[]; markRead: (id: number) => void; markAllRead: () => void;
  approvals: TrainerApplication[];
  applicationsLoading: boolean; applicationsError: string;
  updateApplicationStatus: (id: string, status: AccountStatus) => Promise<TrainerApplication>;
  profile: { name: string; role: string; location: string; bio: string; skills: string[] };
  updateProfile: (profile: AppContextValue['profile']) => void;
  toast: (message: string) => void;
};
const AppContext = createContext<AppContextValue | null>(null);
const useApp = () => {
  const value = useContext(AppContext);
  if (!value) throw new Error('App context is not available');
  return value;
};

function initials(name: string) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2); }
function statusLabel(status: AccountStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
function statusPillClass(status: AccountStatus) {
  return status === 'APPROVED' ? 'pill-teal' : status === 'PENDING' ? 'pill-coral' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
}
function IconAvatar({ text, size = 'md', tone = 'teal' }: { text: string; size?: 'sm' | 'md' | 'lg'; tone?: 'teal' | 'coral' | 'sand' }) {
  return <div data-testid={`avatar-${text}`} className={`avatar ${size === 'sm' ? 'h-7 w-7 text-[9px]' : size === 'lg' ? 'h-16 w-16 text-lg' : 'h-9 w-9'} ${tone === 'coral' ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]' : tone === 'sand' ? 'bg-[#d8ba76] text-[#314444]' : ''}`}>{text}</div>;
}
function ProgressBar({ value, color = 'primary' }: { value: number; color?: 'primary' | 'coral' }) {
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]" aria-label={`${value}% complete`}><div className={`progress-fill h-full rounded-full ${color === 'coral' ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary))]'}`} style={{ width: `${value}%` }} /></div>;
}
function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4"><div>{eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}<h2 className="text-[22px] font-bold tracking-[-.045em]">{title}</h2></div>{action}</div>;
}
function NoticeToast({ message, close }: { message: string; close: () => void }) {
  return <div className="fixed bottom-5 right-5 z-[90] flex animate-rise items-center gap-3 rounded-xl bg-[hsl(var(--sidebar))] px-4 py-3 text-sm text-[hsl(var(--sidebar-foreground))] shadow-2xl"><Check size={16} className="text-[hsl(var(--sidebar-primary))]" />{message}<button data-testid="button-close-toast" onClick={close} className="ml-2 opacity-60 hover:opacity-100"><X size={15} /></button></div>;
}

function LoadingScreen() {
  return <div className="auth-page"><div className="auth-loading"><div className="brand-mark">p</div><div className="skeleton h-2 w-24 rounded-full" /></div></div>;
}

async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const data = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

function AuthScreen() {
  const [location, setLocation] = useLocation();
  const { signIn, signUp } = useApp();
  const isAdmin = location === '/admin/login';
  const isSignup = location === '/signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'ADMIN'>>('TRAINEE');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (isSignup) {
        const result = await signUp({ name, email, password, role });
        setMessage(result.message);
        if (!result.needsEmailVerification && result.status === 'APPROVED') setLocation('/login');
      } else {
        const user = await signIn(email, password, isAdmin);
        setLocation(user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'TRAINER' ? '/trainer/dashboard' : '/trainee/dashboard');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Please check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="auth-page noise">
    <div className="auth-brand"><div className="brand-mark">p</div><span className="brand-word">capacity<span className="text-[hsl(var(--primary))]">connect.</span></span></div>
    <div className="auth-layout">
      <section className="auth-intro">
        <div className="eyebrow mb-4">{isAdmin ? 'Operations access' : isSignup ? 'A better way to grow' : 'Welcome back'}</div>
        <h1 className="display-title">{isAdmin ? <>Make capacity<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">visible.</span></> : <>Build proof<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">that travels.</span></>}</h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{isAdmin ? 'Review people, skills, and learning signals from one accountable workspace.' : 'Learning that becomes momentum, a stronger profile, and a room of people worth learning with.'}</p>
        <div className="auth-proof"><div className="auth-proof-mark"><ShieldCheck size={17} /></div><div><div className="text-xs font-bold">One secure workspace</div><div className="mt-1 text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">Your access is checked on the server every time you return.</div></div></div>
      </section>
      <section className="auth-card card-surface">
        <div className="mb-7 flex items-center justify-between"><div><div className="eyebrow mb-2">{isSignup ? 'Create your account' : isAdmin ? 'Admin sign in' : 'Member sign in'}</div><h2 className="text-2xl font-bold tracking-[-.05em]">{isSignup ? 'Start with your next step.' : 'Good to see you.'}</h2></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--accent)/.2)] text-[hsl(var(--foreground))]">{isAdmin ? <ShieldCheck size={19} /> : <UserRound size={19} />}</div></div>
        {isSignup && <label className="mb-4 block text-xs font-bold">Full name<input data-testid="input-signup-name" className="form-input mt-2" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-bold">Email address<input data-testid="input-auth-email" className="form-input mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label className="block text-xs font-bold">Password<input data-testid="input-auth-password" className="form-input mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} required /><span className="mt-2 block text-[10px] font-normal text-[hsl(var(--muted-foreground))]">Use at least 8 characters.</span></label>
          {isSignup && <div><div className="mb-2 text-xs font-bold">I am joining as</div><div className="grid grid-cols-2 gap-2">{(['TRAINEE', 'TRAINER'] as const).map((item) => <button type="button" key={item} onClick={() => setRole(item)} className={`rounded-lg border p-3 text-left transition-colors ${role === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)]' : 'border-[hsl(var(--border))]'}`}><div className="text-xs font-bold">{roleCopy[item].label}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{role === item && item === 'TRAINER' ? 'Application review required' : roleCopy[item].description}</div></button>)}</div></div>}
          {error && <div role="alert" className="rounded-lg border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] p-3 text-xs leading-5 text-[hsl(var(--destructive))]">{error}</div>}
          {message && <div role="status" className="rounded-lg border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.08)] p-3 text-xs leading-5 text-[hsl(var(--primary))]">{message}</div>}
          <button data-testid="button-auth-submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Checking…' : isSignup ? 'Create account' : 'Sign in'} <ArrowRight size={14} /></button>
        </form>
        {!isAdmin && !isSignup && <div className="mt-5 text-center text-xs text-[hsl(var(--muted-foreground))]">New here? <button className="font-bold text-[hsl(var(--primary))]" onClick={() => setLocation('/signup')}>Create a member account</button></div>}
        {!isAdmin && isSignup && <div className="mt-5 text-center text-xs text-[hsl(var(--muted-foreground))]">Already have an account? <button className="font-bold text-[hsl(var(--primary))]" onClick={() => setLocation('/login')}>Sign in</button></div>}
        {isAdmin && <div className="mt-5 text-center text-xs text-[hsl(var(--muted-foreground))]">Member of the learning network? <button className="font-bold text-[hsl(var(--primary))]" onClick={() => setLocation('/login')}>Use member sign in</button></div>}
      </section>
    </div>
    <div className="auth-footer">Capacity Connect · Learning that strengthens the whole system</div>
  </div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { notices, profile, role, user, globalSearch, setGlobalSearch, toast } = useApp();
  const nav = role === 'TRAINER'
    ? [
      { href: '/trainer/dashboard', label: 'Dashboard', icon: HomeIcon },
      { href: '/learning', label: 'Courses', icon: BookOpen },
      { href: '/trainer', label: 'Trainer hub', icon: GraduationCap },
       { href: '/sessions', label: 'Live sessions', icon: Clock3 },
      { href: '/competencies', label: 'Competencies', icon: Target },
    ]
    : role === 'ADMIN'
      ? [
        { href: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/admin', label: 'Control center', icon: ShieldCheck },
        { href: '/insights', label: 'Capacity reports', icon: BarChart3 },
        { href: '/competencies', label: 'Competencies', icon: Target },
        { href: '/learning', label: 'Courses', icon: BookOpen },
      ]
      : [
        { href: '/trainee/dashboard', label: 'Home', icon: HomeIcon },
         { href: '/path', label: 'My path', icon: Target },
        { href: '/learning', label: 'Learning', icon: BookOpen },
        { href: '/network', label: 'Network', icon: Users },
      ];
  const utility = [
    { href: '/passport', label: 'Skill passport', icon: Award },
    { href: '/accessibility', label: 'Access mode', icon: SlidersHorizontal },
    { href: '/profile', label: 'My profile', icon: UserRound },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ];
  const unread = notices.filter((notice) => !notice.read).length;
  const NavLink = ({ item }: { item: typeof nav[number] }) => <Link href={item.href} data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`} className={`nav-item ${location === item.href ? 'active' : ''}`}><item.icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.href === '/notifications' && unread > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[10px] font-bold text-[hsl(var(--foreground))]">{unread}</span>}</Link>;
  return <div className="app-shell noise">
    <aside className="sidebar">
       <Link href="/" className="mb-12 flex items-center gap-3 px-3" data-testid="link-brand"><div className="brand-mark">p</div><span className="brand-word">capacity<span className="text-[hsl(var(--sidebar-primary))]">connect.</span></span></Link>
       <div className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--sidebar-foreground)/.35)]">Your workspace</div>
       <div className="mb-3 flex items-center justify-between rounded-lg bg-[hsl(var(--sidebar-accent)/.7)] px-3 py-2.5"><span className="text-xs font-bold">{roleCopy[role].label}</span><span className="pill bg-[hsl(var(--sidebar-primary)/.18)] text-[hsl(var(--sidebar-primary))]">Verified</span></div>
      <nav className="space-y-1">{nav.map((item) => <NavLink key={item.href} item={item} />)}</nav>
       <div className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--sidebar-foreground)/.35)]">Your presence</div>
      <nav className="space-y-1">{utility.map((item) => <NavLink key={item.href} item={item} />)}</nav>
      <div className="mt-auto rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.55)] p-3.5">
         <div className="mb-3 flex items-center gap-2.5"><IconAvatar text={initials(profile.name)} size="sm" tone="coral" /><div className="min-w-0"><div className="truncate text-xs font-bold">{profile.name}</div><div className="truncate text-[10px] text-[hsl(var(--sidebar-foreground)/.5)]">{user?.email}</div></div></div>
        <Link href="/profile" data-testid="link-view-profile" className="flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--sidebar-primary))]">View profile <ArrowRight size={13} /></Link>
      </div>
    </aside>
    <div className="main-frame">
       <header className="topbar">
          <div className="topbar-greeting text-[13px] font-semibold text-[hsl(var(--muted-foreground))]">{location === '/' ? (role === 'ADMIN' ? 'Platform overview' : role === 'TRAINER' ? 'Tuesday, 14 May 2024' : 'Tuesday, 14 May 2024') : location === '/learning' ? 'Your learning library' : location === '/path' ? 'Personalized learning path' : location === '/passport' ? 'Skill passport' : location === '/verify' ? 'Certificate verification' : location === '/accessibility' ? 'Accessibility preferences' : location === '/competencies' ? 'Competency intelligence' : 'Keep your momentum visible'}</div>
        <div className="top-search"><Search size={15} /><input data-testid="input-global-search" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { setLocation('/learning'); toast(globalSearch.trim() ? `Searching for “${globalSearch.trim()}”.` : 'Browse the learning library.'); } }} placeholder="Search learning, people..." /></div>
        <div className="flex items-center gap-2"><Link href="/notifications" data-testid="link-top-notifications" className="icon-btn relative"><Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />}</Link><Link href="/profile" data-testid="link-top-profile"><IconAvatar text={initials(profile.name)} size="sm" /></Link></div>
      </header>
      <main>{children}</main>
      <nav className="mobile-nav">{[...nav, utility[0]].map((item) => <NavLink key={item.href} item={item} />)}</nav>
    </div>
  </div>;
}

function TraineeHome() {
  const { profile, courseCatalog, learningSummary, learningLoading, advance, progressFor, toast } = useApp();
  const [assessment, setAssessment] = useState(false);
  const activeBase = courseCatalog.find((course) => course.enrolled) || courseCatalog[0];
  if (learningLoading && !activeBase) return <div className="content-wrap"><div className="card-surface p-8 text-sm text-[hsl(var(--muted-foreground))]">Loading your learning workspace…</div></div>;
  if (!activeBase) return <div className="content-wrap"><div className="card-surface p-8"><div className="eyebrow mb-3">Your learning shelf</div><h1 className="text-2xl font-bold">Your first path starts here.</h1><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Explore the learning library to choose a course and begin building your proof.</p><Link href="/learning" className="btn btn-primary mt-5">Explore learning <ArrowRight size={14} /></Link></div></div>;
  const active = { ...activeBase, progress: progressFor(activeBase.id) };
  const totalProgress = learningSummary.overallProgress;
  const activities: { action: string; title: string; time: string; Icon: LucideIcon }[] = learningSummary.activities.map((activity) => ({
    action: activity.action,
    title: courseCatalog.find((course) => course.id === activity.title)?.title || activity.title,
    time: activity.date,
    Icon: activity.action === 'Completed' ? Award : activity.action === 'Progressed' ? TrendingUp : BookOpen,
  }));
  return <div className="content-wrap">
    <div className="mb-9 flex animate-rise items-end justify-between gap-5">
      <div><div className="eyebrow mb-3">Your next chapter</div><h1 data-testid="text-home-heading" className="display-title">Good morning, {profile.name.split(' ')[0]}<span className="text-[hsl(var(--accent))]">.</span></h1><p className="mt-3 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">A little progress today gives your future self more to work with.</p></div>
       <div className="hidden items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-semibold md:flex"><Flame size={15} className="text-[hsl(var(--accent))]" /> {learningSummary.streak} day streak <span className="text-[hsl(var(--muted-foreground))]">·</span> keep it going</div>
    </div>
    <div className="grid animate-rise gap-5 lg:grid-cols-[1.42fr_.78fr]">
      <section className="card-surface relative overflow-hidden bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[32px] border-[hsl(var(--sidebar-primary)/.1)]" /><div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full border-[18px] border-[hsl(var(--accent)/.14)]" />
        <div className="relative"><div className="mb-8 flex items-center justify-between"><span className="eyebrow text-[hsl(var(--sidebar-primary))]">In progress</span><span className="pill bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground)/.75)]">{active.category}</span></div><div className="max-w-lg"><h2 className="serif text-4xl leading-[.95] tracking-[-.03em] sm:text-5xl">{active.title}</h2><p className="mt-4 max-w-md text-sm leading-6 text-[hsl(var(--sidebar-foreground)/.62)]">{active.description}</p></div><div className="mt-9 flex items-end justify-between gap-5"><div className="w-48"><div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[.1em] text-[hsl(var(--sidebar-foreground)/.58)]"><span>{active.progress}% complete</span><span>{active.duration}</span></div><ProgressBar value={active.progress} /></div><Link href={`/course/${active.id}`} data-testid="link-continue-course" className="btn bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">Continue <ArrowRight size={14} /></Link></div></div>
      </section>
      <section className="card-surface animate-rise stagger-1 flex flex-col justify-between p-6">
         <div><div className="mb-7 flex items-center justify-between"><span className="eyebrow">Your rhythm</span><TrendingUp size={17} className="text-[hsl(var(--primary))]" /></div><div className="flex items-end gap-3"><span data-testid="text-overall-progress" className="metric-number">{totalProgress}%</span><span className="mb-1 text-xs text-[hsl(var(--muted-foreground))]">pathway complete</span></div><div className="mt-3"><ProgressBar value={totalProgress} color="coral" /></div></div>
         <div className="mt-7 grid grid-cols-7 items-end gap-1.5 border-b border-[hsl(var(--border))] pb-1 pt-4">{learningSummary.weeklyActivity.map((minutes, index) => <div key={index} className="flex flex-col items-center gap-1.5"><div className={`chart-bar w-full ${index === 6 ? 'bg-[hsl(var(--accent))]' : ''}`} style={{ height: `${Math.max(minutes ? minutes * .45 : 4, 4)}px` }} /><span className="mono text-[8px] text-[hsl(var(--muted-foreground))]">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span></div>)}</div>
         <div className="mt-5 flex items-center gap-2 text-xs font-semibold"><Zap size={14} className="text-[hsl(var(--accent))]" /> {Math.floor(learningSummary.weeklyMinutes / 60)}h {learningSummary.weeklyMinutes % 60}m learned this week</div>
      </section>
    </div>
    <div className="mt-10 grid gap-8 lg:grid-cols-[1.42fr_.78fr]">
       <section className="animate-rise stagger-2"><SectionHeading eyebrow="Pick up where you left off" title="Your learning shelf" action={<Link href="/learning" data-testid="link-all-learning" className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]">Explore all <ArrowRight size={13} /></Link>} /><div className="grid gap-4 sm:grid-cols-2">{courseCatalog.filter((course) => course.enrolled).slice(0, 2).map((course) => <CourseMini key={course.id} course={course} onContinue={() => { void advance(course.id).then(() => toast('Progress saved — nice work.')); }} />)}</div></section>
      <section className="animate-rise stagger-3"><SectionHeading eyebrow="Make it count" title="Next up" /><div className="card-surface overflow-hidden"><div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--accent)/.13)] p-5"><div className="mb-4 flex items-center justify-between"><span className="pill pill-coral">Assessment</span><span className="mono text-[10px] text-[hsl(var(--muted-foreground))]">12 min</span></div><h3 className="text-[17px] font-bold tracking-[-.03em]">Storytelling checkpoint</h3><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Three questions to turn the last module into usable proof.</p></div><div className="p-5"><div className="mb-4 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Clock3 size={14} /> Due tomorrow · Product storytelling</div><button data-testid="button-start-assessment" className="btn btn-primary w-full" onClick={() => setAssessment(true)}>Start assessment <ArrowRight size={14} /></button></div></div></section>
    </div>
     <section className="mt-10 animate-rise stagger-3"><SectionHeading eyebrow="Your footprint" title="Recent activity" action={<Link href="/network" data-testid="link-see-network" className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]">Open network <ArrowRight size={13} /></Link>} /><div className="card-surface divide-y divide-[hsl(var(--border))]">{activities.length ? activities.map(({ action, title, time, Icon: ActivityIcon }, index) => <div key={`${title}-${time}`} className="flex items-center gap-4 p-4 sm:p-5"><div className={`grid h-9 w-9 place-items-center rounded-lg ${index === 0 ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}><ActivityIcon size={16} /></div><div className="min-w-0 flex-1"><div className="text-xs text-[hsl(var(--muted-foreground))]">{action}</div><div data-testid={`text-activity-${index}`} className="truncate text-sm font-semibold">{title}</div></div><span className="hidden text-[11px] text-[hsl(var(--muted-foreground))] sm:block">{time}</span><ChevronDown size={14} className="-rotate-90 text-[hsl(var(--muted-foreground))]" /></div>) : <div className="p-6 text-sm text-[hsl(var(--muted-foreground))]">Your meaningful learning activity will appear here.</div>}</div></section>
    {assessment && <AssessmentModal close={() => setAssessment(false)} />}
  </div>;
}

function LearningPath() {
  const { profile, progressFor, advance, toast } = useApp();
  const [goal, setGoal] = useState('Data Analyst');
  const [showImpact, setShowImpact] = useState(false);
  const pathProgress = Math.round(personalizedSteps.reduce((sum, step) => sum + progressFor(step.courseId), 0) / personalizedSteps.length);
  const pathSignals: { label: string; detail: string; Icon: LucideIcon }[] = [
    { label: 'Profile', detail: 'Skills + goals', Icon: UserRound },
    { label: 'Gap analysis', detail: '3 priority gaps', Icon: Target },
    { label: 'Learning path', detail: `${pathProgress}% complete`, Icon: BookOpen },
    { label: 'Skill improvement', detail: 'Measured next', Icon: TrendingUp },
  ];
  return <div className="content-wrap">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5 animate-rise">
      <div><div className="eyebrow mb-3">Your recommended route</div><h1 className="display-title">Learn toward a<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">role that matters.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">We looked at your current skills, interests, and goals to turn a course catalogue into a practical next move.</p></div>
      <label className="block min-w-48 text-[10px] font-bold uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Your target role<select data-testid="select-learning-goal" className="form-input mt-2 text-xs font-semibold" value={goal} onChange={(event) => setGoal(event.target.value)}><option>Data Analyst</option><option>Product Manager</option><option>People Leader</option></select></label>
    </div>
    <section className="mb-8 grid gap-3 sm:grid-cols-4">
      {pathSignals.map(({ label, detail, Icon }, index) => <div key={label} className={`card-surface animate-rise p-4 ${index ? `stagger-${Math.min(index, 3)}` : ''}`}><div className="mb-5 flex items-center justify-between"><span className="eyebrow">{label}</span><span className="grid h-7 w-7 place-items-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Icon size={14} /></span></div><div className="text-sm font-bold">{detail}</div>{index === 2 && <div className="mt-3"><ProgressBar value={pathProgress} /></div>}</div>)}
    </section>
    <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
      <section className="card-surface animate-rise p-6"><SectionHeading eyebrow={`Built for ${profile.name.split(' ')[0]}`} title={`${goal} skill signal`} /><p className="mb-6 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Your recommendations begin with what you already know, then prioritize the shortest route to role readiness.</p><div className="space-y-4">{traineeSkills.map((item) => <div key={item.skill}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold">{item.skill}</span><span className={`pill ${item.status.includes('Gap') ? 'pill-coral' : 'pill-teal'}`}>{item.status}</span></div><div className="flex items-center gap-3"><ProgressBar value={item.current} /><span className="mono w-8 text-right text-[10px]">{item.current}%</span></div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Target for {goal}: {item.target}%</div></div>)}</div><Link href="/competencies" data-testid="link-path-gap-analysis" className="mt-6 flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3 text-xs font-bold text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary)/.5)]">Open full gap analysis <ArrowRight size={14} /></Link></section>
      <section className="animate-rise stagger-1"><SectionHeading eyebrow="The path, in order" title={`Your ${goal} route`} action={<span className="pill pill-teal">{personalizedSteps.length} steps</span>} /><div className="space-y-3">{personalizedSteps.map((step, index) => { const progress = progressFor(step.courseId); const course = courses.find((item) => item.id === step.courseId); return <article key={step.courseId} className="card-surface hoverable p-5"><div className="flex items-start gap-4"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${progress >= 100 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]'}`}>{progress >= 100 ? <Check size={16} /> : `0${index + 1}`}</div><div className="min-w-0 flex-1"><div className="eyebrow">{step.category}</div><Link href={`/course/${step.courseId}`} data-testid={`link-path-step-${step.courseId}`} className="mt-1 block text-base font-bold tracking-[-.03em] hover:text-[hsl(var(--primary))]">{step.title}</Link><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{step.reason}</p><div className="mt-4 flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]"><span>{step.duration}</span><span>·</span><span>{course?.lessons} lessons</span></div>{progress > 0 && <div className="mt-4"><ProgressBar value={progress} /></div>}</div><button data-testid={`button-path-step-${step.courseId}`} className={`btn shrink-0 ${progress >= 100 ? 'btn-quiet' : 'btn-primary'}`} onClick={() => { advance(step.courseId); toast(progress >= 92 ? `${step.title} completed — your skill signal improved.` : `${step.title} added to your active path.`); }}>{progress >= 100 ? 'Done' : progress > 0 ? 'Continue' : 'Start'}</button></div></article>; })}</div></section>
    </div>
    <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_.9fr]">
      <div className="card-surface animate-rise stagger-2 p-6"><div className="flex items-start justify-between gap-4"><div><div className="eyebrow mb-2">Pre-test → training → post-test</div><h2 className="text-2xl font-bold tracking-[-.05em]">Show the work changed you.</h2><p className="mt-2 max-w-md text-xs leading-5 text-[hsl(var(--muted-foreground))]">Your data foundations assessment gives the pathway a baseline, then makes improvement visible.</p></div><TrendingUp size={22} className="text-[hsl(var(--primary))]" /></div><div className="mt-7 grid grid-cols-3 items-end gap-3"><div><div className="metric-number">48%</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Before training</div></div><div className="mb-4 h-px bg-[hsl(var(--border))]" /><div><div className="metric-number text-[hsl(var(--primary))]">81%</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">After training</div></div></div><button data-testid="button-view-impact" className="btn btn-outline mt-6" onClick={() => { setShowImpact(!showImpact); toast(showImpact ? 'Impact detail collapsed.' : 'Impact detail opened.'); }}>{showImpact ? 'Hide impact detail' : 'View impact detail'} <ArrowRight size={13} /></button>{showImpact && <div className="mt-4 rounded-lg bg-[hsl(var(--primary)/.08)] p-4 text-xs leading-5"><span className="font-bold text-[hsl(var(--primary))]">+33% improvement.</span> The post-test shows stronger SQL reasoning and clearer interpretation of data patterns.</div>}</div>
      <div className="card-surface animate-rise stagger-3 bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))]"><div className="eyebrow text-[hsl(var(--sidebar-primary))]">Explainable recommendation</div><h2 className="serif mt-3 text-3xl leading-[1.05]">Next up: SQL Intermediate.</h2><p className="mt-3 text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.65)]">Your Data Analytics competency is strong, but SQL assessment performance is below your target level.</p><Link href="/course/sql-intermediate" data-testid="link-recommended-course" className="btn mt-6 bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">See recommended course <ArrowRight size={14} /></Link></div>
    </section>
  </div>;
}

function TraineeCompetencyView() {
  const { toast } = useApp();
  return <div className="content-wrap">
    <div className="mb-8 animate-rise"><div className="eyebrow mb-3">Your competency signal</div><h1 className="display-title">Know the gap.<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">Close the gap.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">See what you bring to your target role, what is holding you back, and why the next step in your path was recommended.</p></div>
    <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
      <section className="card-surface animate-rise p-6"><div className="mb-6 flex items-center justify-between"><div><div className="eyebrow">Target role</div><h2 className="mt-1 text-2xl font-bold tracking-[-.05em]">Data Analyst</h2></div><span className="pill pill-teal">In progress</span></div><div className="space-y-5">{traineeSkills.map((item) => <div key={item.skill}><div className="mb-2 flex items-center justify-between text-xs font-semibold"><span>{item.skill}</span><span className="mono text-[10px] text-[hsl(var(--muted-foreground))]">{item.current}% / {item.target}%</span></div><div className="relative"><ProgressBar value={item.current} /><div className="absolute -top-1 h-3 w-px bg-[hsl(var(--foreground)/.55)]" style={{ left: `${item.target}%` }} /></div><div className="mt-1 flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]"><span>{item.status}</span><span>Target marker</span></div></div>)}</div></section>
      <section className="card-surface animate-rise stagger-1 p-6"><div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--accent)/.18)] text-[hsl(var(--accent-foreground))]"><Target size={18} /></div><div><div className="eyebrow">Three gaps to close</div><h2 className="mt-1 text-lg font-bold">Your shortest route</h2></div></div><div className="space-y-3">{personalizedSteps.map((step, index) => <div key={step.courseId} className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] p-3"><div className="mono text-xs text-[hsl(var(--primary))]">0{index + 1}</div><div className="min-w-0 flex-1"><div className="text-xs font-bold">{step.title}</div><div className="mt-1 truncate text-[10px] text-[hsl(var(--muted-foreground))]">{step.reason}</div></div><ArrowRight size={14} className="text-[hsl(var(--muted-foreground))]" /></div>)}</div><Link href="/path" data-testid="link-start-personalized-path" className="btn btn-primary mt-6 w-full">Open personalized path <ArrowRight size={14} /></Link></section>
    </div>
    <section className="mt-8 card-surface animate-rise stagger-2 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="eyebrow">How the signal works</div><h2 className="mt-1 text-lg font-bold">Evidence, not mystery.</h2><p className="mt-2 max-w-xl text-xs leading-5 text-[hsl(var(--muted-foreground))]">Skill levels combine profile evidence, assessment performance, completed learning, and practical proof. They are a guide for your next move—not a permanent label.</p></div><button data-testid="button-refresh-competency" className="btn btn-outline" onClick={() => toast('Competency signal refreshed from your latest learning activity.')}>Refresh signal <TrendingUp size={14} /></button></div></section>
  </div>;
}

function SkillPassport() {
  const { profile, toast } = useApp();
  return <div className="content-wrap">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-rise"><div><div className="eyebrow mb-3">Your shareable proof</div><h1 className="display-title">Make your skills<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">easy to verify.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">A living professional profile that carries your learning, evidence, and credentials beyond the course catalogue.</p></div><button data-testid="button-share-passport" className="btn btn-primary" onClick={() => toast('Skill passport link copied to your clipboard.') }><Share2 size={14} /> Share profile</button></div>
    <section className="card-surface mb-8 overflow-hidden animate-rise"><div className="h-24 bg-[hsl(var(--sidebar))]" /><div className="p-6 pt-0"><div className="-mt-8 flex flex-wrap items-end justify-between gap-4"><IconAvatar text={initials(profile.name)} size="lg" tone="coral" /><span className="pill pill-teal mb-2"><CheckCircle2 size={12} /> Verified learner</span></div><div className="mt-4"><h2 data-testid="text-passport-name" className="text-2xl font-bold">{profile.name}</h2><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{profile.role} · {profile.location}</p></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[hsl(var(--secondary)/.65)] p-4"><div className="metric-number">6</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Certificates</div></div><div className="rounded-xl bg-[hsl(var(--secondary)/.65)] p-4"><div className="metric-number">12</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Courses completed</div></div><div className="rounded-xl bg-[hsl(var(--accent)/.16)] p-4"><div className="metric-number">24</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Assessments</div></div></div></div></section>
    <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]"><section className="card-surface animate-rise stagger-1 p-6"><SectionHeading eyebrow="Capability snapshot" title="Skills in the passport" /><div className="space-y-5">{passportSkills.map((skill) => <div key={skill.name}><div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">{skill.name}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{skill.level}</span></div><div className="flex items-center gap-3"><ProgressBar value={skill.score} /><span className="mono w-8 text-right text-[10px]">{skill.score}%</span></div></div>)}</div><Link href="/competencies" data-testid="link-passport-competencies" className="mt-7 flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]">View competency evidence <ArrowRight size={13} /></Link></section><section className="card-surface animate-rise stagger-2 p-6"><SectionHeading eyebrow="Credentials" title="Certificates issued" /><div className="space-y-3">{certificates.map((certificate) => <div key={certificate.id} className="rounded-xl border border-[hsl(var(--border))] p-4"><div className="flex items-start gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--accent)/.2)] text-[hsl(var(--accent-foreground))]"><Award size={16} /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold">{certificate.title}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Issued {certificate.issued}</div></div><Check size={15} className="text-[hsl(var(--primary))]" /></div><div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3"><span className="mono text-[10px] text-[hsl(var(--muted-foreground))]">{certificate.id}</span><Link href="/verify" data-testid={`link-verify-${certificate.id}`} className="text-[10px] font-bold text-[hsl(var(--primary))]">Verify <ArrowRight className="ml-1 inline" size={11} /></Link></div></div>)}</div></section></div>
  </div>;
}

function CertificateVerification() {
  const [certificateId, setCertificateId] = useState('CC-2026-001248');
  const [verified, setVerified] = useState<boolean | null>(null);
  return <div className="content-wrap"><div className="mx-auto max-w-3xl animate-rise"><div className="mb-8"><div className="eyebrow mb-3">Public verification</div><h1 className="display-title">Trust the proof<span className="text-[hsl(var(--accent))]">.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">Confirm a Capacity Connect certificate without exposing sensitive personal information.</p></div><section className="card-surface p-6 sm:p-8"><div className="grid gap-8 md:grid-cols-[1fr_.8fr]"><div><div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]"><ShieldCheck size={19} /></div><div><div className="eyebrow">Certificate lookup</div><h2 className="mt-1 text-lg font-bold">Enter a certificate ID</h2></div></div><label className="block text-xs font-bold">Certificate ID<input data-testid="input-certificate-id" className="form-input mt-2" value={certificateId} onChange={(event) => { setCertificateId(event.target.value); setVerified(null); }} /></label><button data-testid="button-verify-certificate" className="btn btn-primary mt-4 w-full" onClick={() => setVerified(certificates.some((certificate) => certificate.id.toLowerCase() === certificateId.trim().toLowerCase()))}>Verify certificate <ArrowRight size={14} /></button>{verified !== null && <div data-testid="status-certificate-verification" className={`mt-4 rounded-lg p-4 text-xs ${verified ? 'bg-[hsl(var(--primary)/.1)]' : 'bg-[hsl(var(--accent)/.15)]'}`}>{verified ? <><div className="flex items-center gap-2 font-bold text-[hsl(var(--primary))]"><CheckCircle2 size={15} /> Verified certificate</div><p className="mt-2 leading-5">Issued by Capacity Connect and associated with a completed learning outcome.</p></> : <><div className="flex items-center gap-2 font-bold"><X size={15} /> Certificate not found</div><p className="mt-2 leading-5">Check the ID and try again.</p></>}</div>}</div><div className="rounded-xl bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))]"><div className="eyebrow text-[hsl(var(--sidebar-primary))]">Verified example</div><div className="serif mt-4 text-3xl">Capacity Connect</div><div className="mt-1 text-xs text-[hsl(var(--sidebar-foreground)/.6)]">Skill passport credential</div><div className="mt-8 space-y-3 text-xs"><div className="flex justify-between border-b border-[hsl(var(--sidebar-border))] pb-3"><span className="text-[hsl(var(--sidebar-foreground)/.55)]">Certificate ID</span><span className="mono">CC-2026-001248</span></div><div className="flex justify-between border-b border-[hsl(var(--sidebar-border))] pb-3"><span className="text-[hsl(var(--sidebar-foreground)/.55)]">Status</span><span className="text-[hsl(var(--sidebar-primary))]">Verified</span></div><div className="flex justify-between"><span className="text-[hsl(var(--sidebar-foreground)/.55)]">Issued</span><span>03 Sep 2026</span></div></div></div></div></section></div></div>;
}

function Accessibility() {
  const { accessibilityMode, toggleAccessibility, toast } = useApp();
  return <div className="content-wrap"><div className="mb-8 animate-rise"><div className="eyebrow mb-3">A more adaptable workspace</div><h1 className="display-title">Make learning<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">work for you.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">Accessibility is part of the learning experience, not a cosmetic setting. Adjust the workspace to support your focus and movement preferences.</p></div><div className="max-w-3xl space-y-5"><section className="card-surface animate-rise p-6"><div className="flex items-center gap-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><SlidersHorizontal size={18} /></div><div className="flex-1"><h2 className="text-lg font-bold">Reduced motion</h2><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Minimize entrance animations and transitions throughout Capacity Connect.</p></div><button data-testid="button-toggle-reduced-motion" aria-pressed={accessibilityMode} onClick={() => { toggleAccessibility(); toast(accessibilityMode ? 'Motion restored.' : 'Reduced motion on.'); }} className={`relative h-6 w-11 rounded-full transition-colors ${accessibilityMode ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-[hsl(var(--card))] transition-transform ${accessibilityMode ? 'translate-x-6' : 'translate-x-1'}`} /></button></div></section><section className="card-surface animate-rise stagger-1 p-6"><div className="mb-5 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--secondary))]"><CheckCircle2 size={17} /></div><div><h2 className="text-sm font-bold">Built-in support</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">The interface keeps essential actions and progress visible.</p></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[hsl(var(--border))] p-4"><div className="text-xs font-bold">Keyboard friendly</div><div className="mt-1 text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">Controls use native buttons, links, labels, and focus states.</div></div><div className="rounded-xl border border-[hsl(var(--border))] p-4"><div className="text-xs font-bold">Readable contrast</div><div className="mt-1 text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">Content and status signals stay legible across light and dark themes.</div></div><div className="rounded-xl border border-[hsl(var(--border))] p-4"><div className="text-xs font-bold">Clear feedback</div><div className="mt-1 text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">Actions announce their result through visible confirmation messages.</div></div><div className="rounded-xl border border-[hsl(var(--border))] p-4"><div className="text-xs font-bold">Progress at a glance</div><div className="mt-1 text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">Skill bars pair visual progress with explicit percentage values.</div></div></div></section></div></div>;
}

function TrainerSessions() {
  const { toast } = useApp();
  const [joined, setJoined] = useState<string[]>([]);
  const sessions = [
    { title: 'Advanced Python: async patterns', date: '10 Sep 2026', time: '5:00 PM', trainer: 'Aarav Mehta', attendees: 24 },
    { title: 'How to tell a useful data story', date: '12 Sep 2026', time: '4:30 PM', trainer: 'Nadia Okoro', attendees: 18 },
    { title: 'Coaching through ambiguity', date: '16 Sep 2026', time: '6:00 PM', trainer: 'Amara Wright', attendees: 31 },
  ];
  const questions = [
    { name: 'Daniel Mensah', question: 'How do I decide whether a metric is worth tracking?', time: '12 min ago', replies: 3 },
    { name: 'Sofia Chen', question: 'Could you share the worksheet from last week’s session?', time: 'Yesterday', replies: 5 },
  ];
  return <div className="content-wrap"><div className="mb-8 animate-rise"><div className="eyebrow mb-3">Learning together</div><h1 className="display-title">Bring the room<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">to the work.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">Join live sessions, revisit the conversation, and keep useful questions attached to the learning path.</p></div><div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><section className="animate-rise"><SectionHeading eyebrow="Coming up" title="Live sessions" action={<button data-testid="button-create-session" className="btn btn-primary" onClick={() => toast('Session creation is ready for trainer setup.')}><Plus size={14} /> Create session</button>} /><div className="space-y-3">{sessions.map((session) => { const isJoined = joined.includes(session.title); return <article key={session.title} className="card-surface hoverable p-5"><div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--accent)/.18)] text-[hsl(var(--accent-foreground))]"><Play size={17} /></div><div className="min-w-0 flex-1"><div className="eyebrow">Live training</div><h2 className="mt-1 text-sm font-bold">{session.title}</h2><div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[hsl(var(--muted-foreground))]"><span>{session.date}</span><span>{session.time}</span><span>{session.trainer}</span><span>{session.attendees} attending</span></div></div><button data-testid={`button-join-session-${session.title.replaceAll(' ', '-').toLowerCase()}`} className={`btn ${isJoined ? 'btn-quiet' : 'btn-outline'}`} onClick={() => { setJoined((current) => isJoined ? current.filter((item) => item !== session.title) : [...current, session.title]); toast(isJoined ? 'You left the live session.' : 'You are on the attendee list.'); }}>{isJoined ? <Check size={13} /> : 'Join session'}</button></div></article>; })}</div></section><section className="animate-rise stagger-1"><SectionHeading eyebrow="Stay curious" title="Course Q&A" action={<button className="btn btn-quiet" onClick={() => toast('Your question is ready to post.')}>Ask a question <ArrowRight size={13} /></button>} /><div className="card-surface divide-y divide-[hsl(var(--border))]">{questions.map((item) => <div key={item.question} className="p-5"><div className="flex items-start gap-3"><IconAvatar text={initials(item.name)} size="sm" tone="sand" /><div className="min-w-0 flex-1"><div className="text-xs font-bold">{item.name}</div><p className="mt-2 text-sm leading-5">{item.question}</p><div className="mt-3 flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]"><span>{item.time}</span><span>{item.replies} replies</span><button className="font-bold text-[hsl(var(--primary))]" onClick={() => toast('Reply composer opened.')}>Reply</button></div></div><MessageCircle size={15} className="text-[hsl(var(--primary))]" /></div></div>)}</div></section></div><section className="mt-8 card-surface animate-rise stagger-2 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="eyebrow">Session archive</div><h2 className="mt-1 text-lg font-bold">Keep the learning attached.</h2><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Recordings, worksheets, and follow-up questions stay connected to the course they belong to.</p></div><button className="btn btn-outline" onClick={() => toast('Session archive opened.')}>Browse recordings <ArrowRight size={14} /></button></div></section></div>;
}

function AdminInsights() {
  const { toast } = useApp();
  const heatmap = [
    ['Trainees', ['green', 'amber', 'red', 'amber', 'green']],
    ['Trainers', ['green', 'green', 'green', 'amber', 'green']],
    ['Organization', ['green', 'amber', 'red', 'amber', 'amber']],
  ];
  const audit = [
    ['03 Sep · 15:31', 'Trainer approved', 'Meera Kapoor can now publish learning content.'],
    ['03 Sep · 15:12', 'Assessment published', 'Python fundamentals is open for 127 trainees.'],
    ['03 Sep · 14:56', 'Course updated', 'Data storytelling received a new worksheet.'],
    ['03 Sep · 14:40', 'Role changed', 'An admin reviewed the trainer workspace.'],
  ];
  return <div className="content-wrap"><div className="mb-8 flex flex-wrap items-end justify-between gap-5 animate-rise"><div><div className="eyebrow mb-3">Organizational intelligence</div><h1 className="display-title">Measure the<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">capacity built.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">See where capability is growing, where the next gaps are forming, and whether training is changing outcomes.</p></div><button data-testid="button-export-capacity-report" className="btn btn-primary" onClick={() => toast('Capacity report prepared for export.')}>Export report <ArrowRight size={14} /></button></div><section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[['Enrollment', '1,000'], ['Completion', '824'], ['Pass rate', '81%'], ['Skill improvement', '+28%'], ['Certificates', '612']].map(([label, value], index) => <div key={label} className={`card-surface animate-rise p-5 ${index ? `stagger-${Math.min(index, 3)}` : ''}`}><div className="eyebrow mb-6">{label}</div><div className={`metric-number ${index === 3 ? 'text-[hsl(var(--primary))]' : ''}`}>{value}</div><div className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">{index === 3 ? 'pre → post assessment' : 'this learning cycle'}</div></div>)}</section><div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr]"><section className="card-surface animate-rise p-6"><SectionHeading eyebrow="Competency heatmap" title="Where capability sits" /><div className="grid grid-cols-[1fr_repeat(5,32px)] items-center gap-3 text-[10px]"><div /><div className="rotate-[-42deg] text-center text-[9px] text-[hsl(var(--muted-foreground))]">Python</div><div className="rotate-[-42deg] text-center text-[9px] text-[hsl(var(--muted-foreground))]">SQL</div><div className="rotate-[-42deg] text-center text-[9px] text-[hsl(var(--muted-foreground))]">ML</div><div className="rotate-[-42deg] text-center text-[9px] text-[hsl(var(--muted-foreground))]">Cloud</div><div className="rotate-[-42deg] text-center text-[9px] text-[hsl(var(--muted-foreground))]">Leadership</div>{heatmap.map(([label, values]) => <Fragment key={String(label)}><div className="font-semibold">{label}</div>{(values as string[]).map((value, index) => <div key={`${label}-${index}`} className={`mx-auto h-6 w-6 rounded-md ${value === 'green' ? 'bg-[hsl(var(--primary)/.75)]' : value === 'amber' ? 'bg-[hsl(var(--accent)/.75)]' : 'bg-[hsl(var(--sidebar))]'}`} title={`${label}: ${value}`} />)}</Fragment>)}</div><div className="mt-8 flex flex-wrap gap-4 text-[10px] text-[hsl(var(--muted-foreground))]"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--primary)/.75)]" /> Strength</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--accent)/.75)]" /> Developing</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--sidebar))]" /> Priority gap</span></div></section><section className="card-surface animate-rise stagger-1 p-6"><SectionHeading eyebrow="Training ROI" title="Impact over time" action={<span className="pill pill-teal">+33% average gain</span>} /><div className="flex items-end gap-3 border-b border-[hsl(var(--border))] pb-2 pt-5">{[48, 53, 60, 64, 72, 81].map((value, index) => <div key={value} className="flex flex-1 flex-col items-center gap-2"><div className={`chart-bar w-full ${index === 5 ? 'bg-[hsl(var(--accent))]' : ''}`} style={{ height: `${value * .62}px` }} /><span className="mono text-[9px] text-[hsl(var(--muted-foreground))]">{value}%</span></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]"><span>Pre-test</span><span>Post-test</span></div><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[hsl(var(--secondary)/.65)] p-4"><div className="metric-number">81%</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">assessment pass rate</div></div><div className="rounded-xl bg-[hsl(var(--primary)/.1)] p-4"><div className="metric-number text-[hsl(var(--primary))]">612</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">certificates issued</div></div></div></section></div><div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_.95fr]"><section className="card-surface animate-rise stagger-2 p-6"><SectionHeading eyebrow="Scale the work" title="Bulk operations" /><div className="space-y-3"><button className="flex w-full items-center gap-3 rounded-lg border border-[hsl(var(--border))] p-4 text-left hover:bg-[hsl(var(--secondary)/.5)]" onClick={() => toast('Bulk course assignment opened.')}><Users size={16} className="text-[hsl(var(--primary))]" /><span className="flex-1"><span className="block text-xs font-bold">Assign a course to a cohort</span><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">Select 50 trainees and enroll them together.</span></span><ArrowRight size={14} /></button><button className="flex w-full items-center gap-3 rounded-lg border border-[hsl(var(--border))] p-4 text-left hover:bg-[hsl(var(--secondary)/.5)]" onClick={() => toast('CSV import validation opened.')}><Upload size={16} className="text-[hsl(var(--primary))]" /><span className="flex-1"><span className="block text-xs font-bold">Import trainees by CSV</span><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">Validate records before invitations are sent.</span></span><ArrowRight size={14} /></button></div></section><section className="card-surface animate-rise stagger-3 p-6"><SectionHeading eyebrow="Audit trail" title="Important events" /><div className="space-y-4">{audit.map(([time, title, detail]) => <div key={title} className="flex gap-3"><div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--primary))]" /><div><div className="mono text-[9px] text-[hsl(var(--muted-foreground))]">{time}</div><div className="mt-1 text-xs font-bold">{title}</div><div className="mt-1 text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">{detail}</div></div></div>)}</div></section></div></div>;
}

function Home() {
  const { role } = useApp();
  if (role === 'TRAINER') return <TrainerDashboard />;
  if (role === 'ADMIN') return <AdminDashboard />;
  return <TraineeHome />;
}

function TrainerDashboard() {
  const { toast } = useApp();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const metrics = [
    { label: 'Courses created', value: '08', change: '+2 this quarter', Icon: BookOpen },
    { label: 'Active trainees', value: '127', change: '+18 this month', Icon: Users },
    { label: 'Assessments', value: '14', change: '3 awaiting review', Icon: ClipboardCheck },
    { label: 'Avg. performance', value: '78%', change: '+6% from last month', Icon: TrendingUp },
  ];
  const questionnaires = [
    { title: 'Python fundamentals', due: '12 Sept 2026', participation: 87, status: 'Open' },
    { title: 'Data storytelling checkpoint', due: '18 Sept 2026', participation: 64, status: 'Draft' },
    { title: 'Working with stakeholders', due: '26 Sept 2026', participation: 91, status: 'Open' },
  ];
  return <div className="content-wrap">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5 animate-rise">
      <div><div className="eyebrow mb-3">Trainer workspace</div><h1 className="display-title">Make expertise<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">travel further.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">Teach with clarity, see where learners need you, and keep your best resources close.</p></div>
      <button data-testid="button-create-questionnaire" className="btn btn-primary" onClick={() => setShowQuestionnaire(true)}><Plus size={14} /> Create questionnaire</button>
    </div>
    <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, change, Icon }, index) => <div key={label} className={`card-surface animate-rise p-5 ${index ? `stagger-${Math.min(index, 3)}` : ''}`}><div className="mb-6 flex items-center justify-between"><span className="eyebrow">{label}</span><Icon size={16} className="text-[hsl(var(--primary))]" /></div><div className="metric-number">{value}</div><div className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">{change}</div></div>)}</div>
    <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
      <section className="animate-rise stagger-1"><SectionHeading eyebrow="Keep learners moving" title="Questionnaires" action={<button className="btn btn-quiet" onClick={() => toast('All questionnaires are in view.')}>View all <ArrowRight size={13} /></button>} /><div className="card-surface divide-y divide-[hsl(var(--border))]">{questionnaires.map((item) => <div key={item.title} className="flex flex-wrap items-center gap-4 p-5"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><ClipboardCheck size={17} /></div><div className="min-w-[180px] flex-1"><div className="text-sm font-bold">{item.title}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">Due {item.due} · {item.status}</div></div><div className="w-28"><div className="mb-2 flex justify-between text-[10px]"><span className="text-[hsl(var(--muted-foreground))]">Participation</span><span className="mono">{item.participation}%</span></div><ProgressBar value={item.participation} /></div><button className="icon-btn" onClick={() => toast(`${item.title} opened for review.`)}><ArrowRight size={15} /></button></div>)}</div></section>
      <section className="animate-rise stagger-2"><SectionHeading eyebrow="Your teaching library" title="Recent resources" action={<button className="btn btn-quiet" onClick={() => { setUploaded(true); toast('Upload area is ready.'); }}><Upload size={13} /> Add resource</button>} /><div className="card-surface p-5"><div className="space-y-3">{['Python lecture 01 · Video', 'Python presentation · Slides', 'Practice questions · PDF', 'Study notes · Document'].map((item, index) => <button key={item} onClick={() => toast(`${item} opened in the trainer library.`)} className="flex w-full items-center gap-3 rounded-lg border border-[hsl(var(--border))] p-3 text-left transition-colors hover:border-[hsl(var(--primary)/.45)] hover:bg-[hsl(var(--secondary)/.45)]"><div className={`grid h-8 w-8 place-items-center rounded-lg ${index === 0 ? 'bg-[hsl(var(--accent)/.2)] text-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]'}`}>{index === 0 ? <Play size={14} /> : <FileText size={14} />}</div><span className="flex-1 text-xs font-semibold">{item}</span><span className="text-[10px] text-[hsl(var(--muted-foreground))]">{index === 0 ? '24 min' : 'Updated today'}</span><ArrowRight size={13} /></button>)}</div>{uploaded && <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-[hsl(var(--primary)/.5)] bg-[hsl(var(--primary)/.06)] p-3 text-xs text-[hsl(var(--primary))]"><CheckCircle2 size={15} /> Drop a lecture, presentation, PDF, or link here.</div>}</div></section>
    </div>
    <section className="mt-8 card-surface relative overflow-hidden bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] animate-rise stagger-3 sm:p-7"><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[22px] border-[hsl(var(--sidebar-primary)/.13)]" /><div className="relative flex flex-wrap items-center justify-between gap-5"><div><div className="eyebrow text-[hsl(var(--sidebar-primary))]">Competency signal</div><h2 className="serif mt-2 text-3xl">Your strongest demand is in data storytelling.</h2><p className="mt-2 max-w-xl text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.62)]">Learners with this goal are looking for practical feedback and a trainer with your experience.</p></div><Link href="/competencies" className="btn bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">See trainer matches <ArrowRight size={14} /></Link></div></section>
    {showQuestionnaire && <div className="modal-backdrop"><div className="modal animate-rise"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5"><div><div className="eyebrow mb-1">Trainer tools</div><h2 className="text-lg font-bold">Create questionnaire</h2></div><button className="icon-btn" onClick={() => setShowQuestionnaire(false)}><X size={18} /></button></div><div className="space-y-4 p-6"><label className="block text-xs font-bold">Questionnaire title<input className="form-input mt-2" defaultValue="New competency checkpoint" /></label><label className="block text-xs font-bold">Course<select className="form-input mt-2"><option>Python fundamentals</option><option>Data storytelling checkpoint</option></select></label><label className="block text-xs font-bold">Deadline<input className="form-input mt-2" type="date" defaultValue="2026-09-20" /></label><div className="flex justify-end gap-2 pt-2"><button className="btn btn-quiet" onClick={() => setShowQuestionnaire(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { setShowQuestionnaire(false); toast('Questionnaire saved as a draft.'); }}><Check size={14} /> Save draft</button></div></div></div></div>}
  </div>;
}

function AdminDashboard() {
  const { approvals, applicationsLoading, applicationsError, updateApplicationStatus, toast } = useApp();
  const [announcement, setAnnouncement] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const pendingCount = approvals.filter((application) => application.status === 'PENDING').length;
  const statusCounts = (['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as AccountStatus[]).map((status) => ({
    status,
    count: approvals.filter((application) => application.status === status).length,
  }));
  const changeStatus = async (application: TrainerApplication, status: AccountStatus) => {
    setUpdatingId(application.id);
    try {
      await updateApplicationStatus(application.id, status);
      toast(`${application.name} is now ${statusLabel(status).toLowerCase()}.`);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'We could not update that application.');
    } finally {
      setUpdatingId(null);
    }
  };
  const adminMetrics = [
    { label: 'Total users', value: '2,481', detail: '2,020 trainees · 438 trainers' },
    { label: 'Courses', value: '146', detail: '+12 published this quarter' },
    { label: 'Enrollments', value: '8,742', detail: '82% participation rate' },
    { label: 'Certificates', value: '3,218', detail: '94% learner satisfaction' },
  ];
  return <div className="content-wrap">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5 animate-rise"><div><div className="eyebrow mb-3">Admin control center</div><h1 className="display-title">See the whole<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">capacity system.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">One view across people, learning, performance, and the competencies that keep your organization moving.</p></div><button data-testid="button-publish-announcement" className="btn btn-primary" onClick={() => setAnnouncement(true)}><Plus size={14} /> Publish update</button></div>
    <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{adminMetrics.map(({ label, value, detail }, index) => <div key={label} className={`card-surface animate-rise p-5 ${index ? `stagger-${Math.min(index, 3)}` : ''}`}><div className="mb-6 flex items-center justify-between"><span className="eyebrow">{label}</span><BarChart3 size={16} className="text-[hsl(var(--primary))]" /></div><div className="metric-number">{value}</div><div className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">{detail}</div></div>)}</div>
    <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <section className="animate-rise stagger-1"><SectionHeading eyebrow="Needs your attention" title="Trainer applications" action={<span className="pill pill-coral">{pendingCount} pending · {approvals.length} total</span>} /><div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{statusCounts.map(({ status, count }) => <div key={status} className="rounded-xl border border-[hsl(var(--border))] p-3"><div className={`pill ${statusPillClass(status)}`}>{statusLabel(status)}</div><div className="mt-2 metric-number text-xl">{count}</div></div>)}</div><div className="card-surface divide-y divide-[hsl(var(--border))]">{applicationsLoading ? <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">Loading trainer applications…</div> : applicationsError ? <div className="p-8 text-center"><X className="mx-auto mb-3 text-[hsl(var(--accent))]" size={25} /><h3 className="font-bold">Applications could not load</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{applicationsError}</p></div> : approvals.length ? approvals.map((application) => <div key={application.id} className="flex flex-wrap items-center gap-3 p-4"><IconAvatar text={initials(application.name)} size="sm" tone="sand" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span>{application.name}</span><span className={`pill ${statusPillClass(application.status)}`}>{statusLabel(application.status)}</span></div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{application.email} · {application.location || 'Location not provided'}</div><div className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">Applied {new Date(application.createdAt).toLocaleDateString()}</div></div><div className="flex flex-wrap gap-2">{application.status === 'PENDING' && <><button data-testid={`button-approve-${application.id}`} disabled={updatingId === application.id} className="btn btn-primary px-3 py-2" onClick={() => void changeStatus(application, 'APPROVED')}><Check size={13} /> Approve</button><button data-testid={`button-reject-${application.id}`} disabled={updatingId === application.id} className="btn btn-outline px-3 py-2" onClick={() => void changeStatus(application, 'REJECTED')}><X size={13} /> Reject</button></>}{application.status === 'APPROVED' && <button data-testid={`button-suspend-${application.id}`} disabled={updatingId === application.id} className="btn btn-outline px-3 py-2" onClick={() => void changeStatus(application, 'SUSPENDED')}><ShieldCheck size={13} /> Suspend</button>}{application.status === 'SUSPENDED' && <button data-testid={`button-restore-${application.id}`} disabled={updatingId === application.id} className="btn btn-primary px-3 py-2" onClick={() => void changeStatus(application, 'APPROVED')}><Check size={13} /> Restore</button>}{application.status === 'REJECTED' && <button data-testid={`button-reapprove-${application.id}`} disabled={updatingId === application.id} className="btn btn-primary px-3 py-2" onClick={() => void changeStatus(application, 'APPROVED')}><Check size={13} /> Approve</button>}</div></div>) : <div className="p-8 text-center"><CheckCircle2 className="mx-auto mb-3 text-[hsl(var(--primary))]" size={25} /><h3 className="font-bold">No trainer applications yet</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">New trainer applications will appear here for review.</p></div>}</div></section>
      <section className="animate-rise stagger-2"><SectionHeading eyebrow="Organizational pulse" title="Platform analytics" action={<button className="btn btn-quiet" onClick={() => toast('Analytics export prepared for download.')}>Export report <ArrowRight size={13} /></button>} /><div className="card-surface p-5"><div className="mb-6 flex items-center justify-between"><div><div className="text-sm font-bold">Learning participation</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Active learners across all programs</div></div><span className="metric-number text-[hsl(var(--primary))]">82%</span></div><ProgressBar value={82} /><div className="mt-7 grid grid-cols-3 gap-3">{[['Pass rate', '78%'], ['Active trainers', '438'], ['New content', '24']].map(([label, value]) => <div key={label} className="rounded-xl bg-[hsl(var(--secondary)/.62)] p-4"><div className="mono text-lg font-bold">{value}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{label}</div></div>)}</div><div className="mt-6 flex items-end gap-2 border-b border-[hsl(var(--border))] pb-1">{[42, 61, 55, 72, 68, 84, 82, 91, 82].map((height, index) => <div key={`${height}-${index}`} className="chart-bar flex-1" style={{ height: `${height * .55}px`, opacity: index === 8 ? 1 : .45 + index * .05 }} />)}</div><div className="mt-2 flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]"><span>Jan</span><span>Sep 2026</span></div></div></section>
    </div>
    <section className="mt-8 card-surface animate-rise stagger-3 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]"><Target size={19} /></div><div><div className="eyebrow">Standout system</div><h2 className="mt-1 text-lg font-bold">Competency mapping is ready for review</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Match trainers to organizational needs with explainable scoring.</p></div></div><Link href="/competencies" className="btn btn-outline">Open competency map <ArrowRight size={14} /></Link></div></section>
    {announcement && <div className="modal-backdrop"><div className="modal animate-rise"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5"><div><div className="eyebrow mb-1">Homepage publishing</div><h2 className="text-lg font-bold">Publish an update</h2></div><button className="icon-btn" onClick={() => setAnnouncement(false)}><X size={18} /></button></div><div className="space-y-4 p-6"><label className="block text-xs font-bold">Headline<input className="form-input mt-2" defaultValue="New learning content is live" /></label><label className="block text-xs font-bold">Message<textarea className="form-input mt-2 min-h-24 resize-none" defaultValue="Explore the newest paths added by our trainer community." /></label><div className="flex justify-end gap-2 pt-2"><button className="btn btn-quiet" onClick={() => setAnnouncement(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { setAnnouncement(false); toast('Update published to the Capacity Connect home feed.'); }}><Check size={14} /> Publish now</button></div></div></div></div>}
  </div>;
}

function Competencies() {
  const { role, toast } = useApp();
  const [subject, setSubject] = useState(competencySubjects[0]);
  const [selected, setSelected] = useState(trainerMatches[0].name);
  if (role === 'TRAINEE') return <TraineeCompetencyView />;
  const factors = [
    { label: 'Skill match', value: '40%', width: 92 },
    { label: 'Qualifications', value: '20%', width: 86 },
    { label: 'Experience', value: '20%', width: 78 },
    { label: 'Certifications', value: '10%', width: 90 },
    { label: 'Past performance', value: '10%', width: 94 },
  ];
  const chosen = trainerMatches.find((trainer) => trainer.name === selected) || trainerMatches[0];
  return <div className="content-wrap">
    <div className="mb-8 animate-rise"><div className="eyebrow mb-3">Capacity intelligence</div><h1 className="display-title">Put the right<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">expertise in the room.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Transparent trainer matching for every competency your organization needs next. No mystery score—just visible evidence.</p></div>
    <div className="mb-8 grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
      <section className="card-surface animate-rise p-6"><div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]"><SlidersHorizontal size={18} /></div><div><div className="eyebrow">Required competency</div><h2 className="mt-1 text-lg font-bold">What does your team need?</h2></div></div><div className="space-y-2">{competencySubjects.map((item) => <button key={item} onClick={() => setSubject(item)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs font-semibold transition-colors ${subject === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)] text-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary)/.6)]'}`}>{item}<ChevronDown size={14} className="-rotate-90" /></button>)}</div><div className="mt-6 rounded-xl bg-[hsl(var(--secondary)/.7)] p-4"><div className="flex items-center gap-2 text-xs font-bold"><Layers3 size={14} className="text-[hsl(var(--primary))]" /> How matching works</div><p className="mt-2 text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">Scores combine the evidence your team already trusts: skills, qualifications, experience, certifications, and past performance.</p><div className="mt-4 space-y-2">{factors.map((factor) => <div key={factor.label} className="flex items-center gap-2 text-[10px]"><span className="w-24 text-[hsl(var(--muted-foreground))]">{factor.label}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${factor.width}%` }} /></div><span className="mono w-7 text-right">{factor.value}</span></div>)}</div></div></section>
      <section className="animate-rise stagger-1"><div className="mb-5 flex items-end justify-between gap-4"><div><div className="eyebrow mb-2">Recommended trainers</div><h2 className="text-[22px] font-bold tracking-[-.045em]">{subject}</h2></div><span className="pill pill-teal">3 matches</span></div><div className="space-y-3">{trainerMatches.map((trainer, index) => <button key={trainer.name} onClick={() => setSelected(trainer.name)} className={`card-surface hoverable flex w-full items-center gap-4 p-4 text-left transition-all ${selected === trainer.name ? 'border-[hsl(var(--primary)/.65)] ring-2 ring-[hsl(var(--primary)/.1)]' : ''}`}><IconAvatar text={trainer.initials} tone={index === 0 ? 'coral' : 'sand'} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold">{trainer.name}</span>{index === 0 && <span className="pill pill-coral">Best match</span>}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{trainer.role}</div><div className="mt-3 flex flex-wrap gap-1.5">{trainer.skills.map((skill) => <span key={skill} className="tag px-2 py-1 text-[9px]">{skill}</span>)}</div></div><div className="text-right"><div className="metric-number text-[hsl(var(--primary))]">{trainer.score}%</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">match score</div></div></button>)}</div></section>
    </div>
    <section className="card-surface animate-rise stagger-2 overflow-hidden"><div className="grid gap-0 lg:grid-cols-[1fr_.75fr]"><div className="p-6 sm:p-7"><div className="eyebrow mb-2">Why this match</div><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-[-.05em]">{chosen.name}</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{chosen.role}</p></div><button className="btn btn-primary" onClick={() => toast(`${chosen.name} added to the ${subject} shortlist.`)}><UserCheck size={14} /> Add to shortlist</button></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{[['Experience', chosen.experience], ['Certificates', String(chosen.certifications)], ['Past feedback', chosen.performance], ['Availability', 'Available now']].map(([label, value]) => <div key={label} className="rounded-xl bg-[hsl(var(--secondary)/.62)] p-4"><div className="mono text-lg font-bold">{value}</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{label}</div></div>)}</div></div><div className="bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] sm:p-7"><div className="eyebrow text-[hsl(var(--sidebar-primary))]">A score you can explain</div><div className="mt-5 flex items-center gap-4"><div className="metric-number text-5xl text-[hsl(var(--sidebar-primary))]">{chosen.score}%</div><div className="text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.62)]">overall match<br />for {subject}</div></div><div className="mt-5 space-y-2">{['Python: Advanced', 'ML: Advanced', `${chosen.experience} relevant experience`, 'Relevant certifications', 'Strong trainee feedback'].map((reason) => <div key={reason} className="flex items-center gap-2 text-xs text-[hsl(var(--sidebar-foreground)/.78)]"><Check size={13} className="text-[hsl(var(--sidebar-primary))]" /> {reason}</div>)}</div></div></div></section>
  </div>;
}

function CourseMini({ course, onContinue }: { course: Course; onContinue: () => void }) {
  const { enrolled, progressFor } = useApp();
  const progress = progressFor(course.id);
  const isEnrolled = enrolled.includes(course.id) || progress > 0;
  return <article className="card-surface hoverable p-5"><div className="mb-5 flex items-start justify-between"><div className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: course.color }}><BookOpen size={16} /></div><span className={`pill ${progress ? 'pill-teal' : ''}`}>{progress ? `${progress}%` : course.level}</span></div><Link href={`/course/${course.id}`} data-testid={`link-course-${course.id}`} className="block"><h3 className="min-h-[45px] text-[15px] font-bold leading-5 tracking-[-.025em]">{course.title}</h3></Link><div className="mt-4 flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]"><span>{course.lessons} lessons</span><span>·</span><span>{course.duration}</span></div>{progress > 0 && <div className="mt-4"><ProgressBar value={progress} /></div>}<button data-testid={`button-${isEnrolled ? 'continue' : 'enroll'}-${course.id}`} onClick={onContinue} className={`btn mt-5 w-full ${isEnrolled ? 'btn-quiet' : 'btn-outline'}`}>{isEnrolled ? 'Continue learning' : 'View course'} <ArrowRight size={13} /></button></article>;
}

function AssessmentModal({ close }: { close: () => void }) {
  const { toast } = useApp();
  const [started, setStarted] = useState(false);
  const [choice, setChoice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const options = ['Lead with the user problem', 'List every available feature', 'Start with a long project history'];
  return <div className="modal-backdrop"><div className="modal animate-rise"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5"><div><div className="eyebrow mb-1">Product storytelling</div><h2 className="text-lg font-bold">Storytelling checkpoint</h2></div><button data-testid="button-close-assessment" className="icon-btn" onClick={close}><X size={18} /></button></div>{submitted ? <div className="p-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[hsl(var(--primary)/.13)] text-[hsl(var(--primary))]"><Check size={25} /></div><h3 className="serif text-3xl">That landed.</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">You got 3 of 3. Your next conversation has a stronger opening.</p><button data-testid="button-finish-assessment" className="btn btn-primary mt-6" onClick={() => { close(); toast('Assessment complete — progress updated.'); }}>Back to workspace</button></div> : !started ? <div className="p-7"><div className="mb-6 rounded-xl bg-[hsl(var(--secondary)/.65)] p-5"><Target className="mb-4 text-[hsl(var(--primary))]" size={22} /><h3 className="font-bold">A short proof point</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Three quick questions. No trick answers, just a chance to make the ideas yours.</p></div><div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]"><span>3 questions</span><span>About 12 minutes</span></div><button data-testid="button-begin-assessment" className="btn btn-primary mt-6 w-full" onClick={() => setStarted(true)}>Begin checkpoint <ArrowRight size={14} /></button></div> : <div className="p-7"><div className="mb-6 flex items-center justify-between"><span className="mono text-[10px] text-[hsl(var(--muted-foreground))]">QUESTION 1 OF 3</span><span className="text-xs font-bold text-[hsl(var(--primary))]">33%</span></div><h3 className="text-xl font-bold tracking-[-.03em]">What makes a product story useful?</h3><div className="mt-6 space-y-2">{options.map((option, index) => <button key={option} data-testid={`button-answer-${index}`} onClick={() => setChoice(option)} className={`flex w-full items-center justify-between rounded-lg border p-4 text-left text-sm transition-colors ${choice === option ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.09)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary)/.6)]'}`}><span>{option}</span>{choice === option && <Check size={16} className="text-[hsl(var(--primary))]" />}</button>)}</div><button data-testid="button-submit-assessment" disabled={!choice} className="btn btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40" onClick={() => setSubmitted(true)}>Submit answer <ArrowRight size={14} /></button></div>}</div></div>;
}

function Learning() {
  const { globalSearch, courseCatalog, learningLoading, toast } = useApp();
  const [filter, setFilter] = useState('All paths');
  const [query, setQuery] = useState(globalSearch);
  const [saved, setSaved] = useState<string[]>([]);
  const categories = ['All paths', 'Communication', 'Strategy', 'Leadership', 'Productivity', 'Career craft', 'Data analytics'];
  const results = useMemo(() => courseCatalog.filter((course) => (filter === 'All paths' || course.category === filter) && course.title.toLowerCase().includes(query.toLowerCase())), [courseCatalog, filter, query]);
  if (learningLoading && !courseCatalog.length) return <div className="content-wrap"><div className="card-surface p-8 text-sm text-[hsl(var(--muted-foreground))]">Loading the learning library…</div></div>;
  return <div className="content-wrap"><div className="mb-9 animate-rise"><div className="eyebrow mb-3">The learning library</div><div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="display-title">Build the proof<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">behind your next move.</span></h1><p className="mt-4 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">Short, practical paths for the work you want to be trusted with.</p></div><div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="mono text-[hsl(var(--foreground))]">{courseCatalog.length}</span> paths to explore</div></div></div>
    <div className="mb-7 flex flex-col gap-3 border-b border-[hsl(var(--border))] pb-5 md:flex-row md:items-center md:justify-between"><div className="flex flex-wrap gap-2">{categories.map((item) => <button data-testid={`button-filter-${item.toLowerCase().replace(' ', '-')}`} key={item} onClick={() => setFilter(item)} className={`pill border px-3 py-2 transition-colors ${filter === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]'}`}>{item}</button>)}</div><div className="top-search w-full md:w-60"><Search size={14} /><input data-testid="input-course-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search paths..." /></div></div>
    {results.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((course, index) => <article key={course.id} className={`card-surface hoverable animate-rise p-5 ${index > 2 ? 'stagger-2' : ''}`}><div className="mb-7 flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: course.color }}><Sparkles size={19} /></div><button data-testid={`button-save-course-${course.id}`} onClick={() => { setSaved((current) => current.includes(course.id) ? current.filter((item) => item !== course.id) : [...current, course.id]); toast(saved.includes(course.id) ? 'Removed from saved paths.' : 'Saved for a future learning day.'); }} className={`icon-btn ${saved.includes(course.id) ? 'text-[hsl(var(--accent-foreground))]' : ''}`}><Plus size={17} className={saved.includes(course.id) ? 'rotate-45' : ''} /></button></div><span className="eyebrow">{course.category}</span><Link href={`/course/${course.id}`} data-testid={`link-library-course-${course.id}`} className="mt-2 block"><h2 className="min-h-[50px] text-lg font-bold leading-6 tracking-[-.04em]">{course.title}</h2></Link><p className="mt-3 min-h-[60px] text-xs leading-5 text-[hsl(var(--muted-foreground))]">{course.description}</p><div className="mt-6 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4 text-[10px] text-[hsl(var(--muted-foreground))]"><span className="flex items-center gap-1.5"><Clock3 size={13} /> {course.duration}</span><span>{course.level}</span></div></article>)}</div> : <div data-testid="empty-course-results" className="card-surface flex min-h-64 flex-col items-center justify-center p-8 text-center"><Compass size={27} className="mb-3 text-[hsl(var(--primary))]" /><h3 className="font-bold">Nothing quite matches yet</h3><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Try a broader search or another path.</p><button data-testid="button-clear-course-search" onClick={() => { setQuery(''); setFilter('All paths'); }} className="btn btn-quiet mt-5">Clear filters</button></div>}
  </div>;
}

function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, courseCatalog, learningLoading, enroll, advance, progressFor, toast } = useApp();
  const course = courseCatalog.find((item) => item.id === id);
  if (learningLoading && !course) return <div className="content-wrap"><div className="card-surface p-8 text-sm text-[hsl(var(--muted-foreground))]">Loading course details…</div></div>;
  if (!course) return <div className="content-wrap"><div className="card-surface p-8"><div className="eyebrow mb-3">Course unavailable</div><h1 className="text-2xl font-bold">That learning path could not be found.</h1><Link href="/learning" className="btn btn-primary mt-5">Back to learning <ArrowRight size={14} /></Link></div></div>;
  const progress = progressFor(course.id);
  const isEnrolled = Boolean(course.enrolled) || progress > 0;
  const [tab, setTab] = useState('Syllabus');
  const syllabus = ['Why stories move work', 'Find the human tension', 'Build a three-line brief', 'Present the decision, not the deck', 'Make your proof portable'];
  return <div className="content-wrap"><div className="mb-5 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Link href="/learning" data-testid="link-back-learning" className="hover:text-[hsl(var(--primary))]">Learning</Link><ChevronDown size={13} className="-rotate-90" /><span>{course.category}</span></div><div className="grid gap-7 lg:grid-cols-[1.4fr_.6fr]"><section className="card-surface relative overflow-hidden p-7 sm:p-10"><div className="absolute -right-8 -top-8 h-48 w-48 rounded-full border-[25px]" style={{ borderColor: `${course.accent}35` }} /><span className="eyebrow">{course.category} · {course.level}</span><h1 className="serif relative mt-5 max-w-2xl text-5xl leading-[.96] tracking-[-.035em] sm:text-6xl">{course.title}</h1><p className="relative mt-6 max-w-xl text-sm leading-7 text-[hsl(var(--muted-foreground))]">{course.description}</p><div className="relative mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="flex items-center gap-2"><Clock3 size={14} /> {course.duration}</span><span className="flex items-center gap-2"><BookOpen size={14} /> {course.lessons} lessons</span><span className="flex items-center gap-2"><Award size={14} /> Certificate included</span></div></section><aside className="card-surface h-fit p-6"><div className="mb-5 flex items-center justify-between"><span className="eyebrow">Your progress</span><span className="mono text-xs text-[hsl(var(--primary))]">{progress}%</span></div><ProgressBar value={progress} color="coral" /><button data-testid="button-course-enrollment" disabled={role !== 'TRAINEE'} onClick={() => { if (role !== 'TRAINEE') return; const action = isEnrolled ? advance(course.id) : enroll(course.id); void action.then(() => toast(isEnrolled ? 'Progress saved — one step at a time.' : 'Course added to your learning shelf.')).catch((error) => toast(error instanceof Error ? error.message : 'We could not save that learning change.')); }} className="btn btn-primary mt-7 w-full disabled:opacity-50">{role !== 'TRAINEE' ? 'Trainee access required' : isEnrolled ? <><Play size={14} /> Continue course</> : <><Plus size={14} /> Enroll in path</>}</button><div className="mt-6 flex items-center gap-3 border-t border-[hsl(var(--border))] pt-5"><IconAvatar text={course.initials} tone="sand" /><div><div className="text-xs font-bold">{course.trainer}</div><div className="text-[10px] text-[hsl(var(--muted-foreground))]">Trainer · course facilitator</div></div></div></aside></div><div className="mt-9 grid gap-8 lg:grid-cols-[1.4fr_.6fr]"><section><div className="mb-5 flex gap-6 border-b border-[hsl(var(--border))]">{['Syllabus', 'Resources'].map((item) => <button data-testid={`button-tab-${item.toLowerCase()}`} key={item} onClick={() => setTab(item)} className={`border-b-2 pb-3 text-xs font-bold ${tab === item ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))]'}`}>{item}</button>)}</div>{tab === 'Syllabus' ? <div className="card-surface divide-y divide-[hsl(var(--border))]">{syllabus.map((lesson, index) => <div key={lesson} className="flex items-center gap-4 p-4"><div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${index < 3 && progress > 0 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>{index < 3 && progress > 0 ? <Check size={14} /> : `0${index + 1}`}</div><span className="flex-1 text-sm font-semibold">{lesson}</span><span className="text-[10px] text-[hsl(var(--muted-foreground))]">{index + 1} lesson{index ? 's' : ''}</span><ChevronDown size={14} className="-rotate-90 text-[hsl(var(--muted-foreground))]" /></div>)}</div> : <div className="card-surface space-y-3 p-5">{['The three-line brief · PDF', 'Story before slides · audio note', 'Decision narrative worksheet'].map((item) => <button data-testid={`button-resource-${item.slice(0, 5)}`} key={item} onClick={() => toast(`${item} opened in the demo.`)} className="flex w-full items-center gap-3 rounded-lg border border-[hsl(var(--border))] p-4 text-left hover:bg-[hsl(var(--secondary)/.5)]"><FileText size={17} className="text-[hsl(var(--primary))]" /><span className="flex-1 text-xs font-semibold">{item}</span><ArrowRight size={14} /></button>)}</div>}</section><aside><div className="eyebrow mb-4">Skills you will practice</div><div className="flex flex-wrap gap-2">{course.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div><div className="mt-9 rounded-xl bg-[hsl(var(--secondary)/.65)] p-5"><Lightbulb size={18} className="mb-4 text-[hsl(var(--accent-foreground))]" /><h3 className="text-sm font-bold">Why this path?</h3><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">The best work is easier to trust when you can tell the story of how you got there.</p></div></aside></div></div>;
}

function Network() {
  const { posts, react, following, follow, publish, toast } = useApp();
  const [draft, setDraft] = useState('');
  const people = [{ name: 'Nadia Okoro', role: 'Research lead · London', initials: 'NO' }, { name: 'Ethan Cole', role: 'Growth strategist · Toronto', initials: 'EC' }, { name: 'Priya Raman', role: 'People partner · Singapore', initials: 'PR' }];
  return <div className="content-wrap"><div className="mb-8 animate-rise"><div className="eyebrow mb-3">The professional network</div><h1 className="display-title">Learn out loud<span className="text-[hsl(var(--accent))]">.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">A thoughtful room for work in progress, useful questions, and the people making things better.</p></div><div className="grid gap-8 lg:grid-cols-[1fr_330px]"><section><div className="card-surface mb-5 p-5"><div className="flex gap-3"><IconAvatar text="AM" size="sm" tone="coral" /><textarea data-testid="input-post-composer" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What are you learning in public?" className="form-input min-h-20 resize-none border-0 bg-[hsl(var(--secondary)/.55)]" /></div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-[hsl(var(--muted-foreground))]">Share a useful observation, not a performance.</span><button data-testid="button-publish-post" disabled={!draft.trim()} onClick={() => { publish(draft); setDraft(''); toast('Your note is now part of the network.'); }} className="btn btn-primary disabled:opacity-40">Share note <ArrowRight size={13} /></button></div></div>{posts.map((post, index) => <article key={post.id} data-testid={`card-post-${post.id}`} className={`card-surface mb-4 animate-rise p-5 ${index ? `stagger-${Math.min(index + 1, 4)}` : ''}`}><div className="flex items-start gap-3"><IconAvatar text={post.initials} tone={index === 1 ? 'sand' : 'teal'} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between"><div><div className="text-sm font-bold">{post.name}</div><div className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{post.role}</div></div><button data-testid={`button-more-post-${post.id}`} onClick={() => toast('Post options are ready for your review.')} className="icon-btn"><MoreHorizontal size={17} /></button></div><div className="mt-4 text-sm leading-6">{post.body}</div><div className="mt-3 flex flex-wrap gap-2">{post.tags.map((tag) => <span className="text-[11px] font-semibold text-[hsl(var(--primary))]" key={tag}>{tag}</span>)}</div><div className="mt-5 flex items-center gap-1 border-t border-[hsl(var(--border))] pt-3"><button data-testid={`button-like-post-${post.id}`} onClick={() => react(post.id)} className={`btn mr-3 px-2 py-1.5 ${post.liked ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}><ThumbsUp size={14} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes}</button><button data-testid={`button-comment-post-${post.id}`} onClick={() => toast('Comments are coming into focus soon.')} className="btn px-2 py-1.5 text-[hsl(var(--muted-foreground))]"><MessageCircle size={14} /> {post.comments}</button><button data-testid={`button-share-post-${post.id}`} onClick={() => toast('Link copied to your clipboard.')} className="btn ml-auto px-2 py-1.5 text-[hsl(var(--muted-foreground))]"><Share2 size={14} /> Share</button></div></div></div></article>)}</section><aside><div className="card-surface p-5"><SectionHeading eyebrow="Make a connection" title="People to follow" /><div className="space-y-4">{people.map((person) => <div key={person.name} className="flex items-center gap-3"><IconAvatar text={person.initials} size="sm" tone="sand" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{person.name}</div><div className="truncate text-[10px] text-[hsl(var(--muted-foreground))]">{person.role}</div></div><button data-testid={`button-follow-${person.name.replace(' ', '-').toLowerCase()}`} onClick={() => { follow(person.name); toast(`${person.name} added to your network.`); }} className={`btn px-2.5 py-1.5 ${following.includes(person.name) ? 'btn-quiet' : 'btn-outline'}`}>{following.includes(person.name) ? <Check size={12} /> : 'Follow'}</button></div>)}</div><Link href="/profile" data-testid="link-network-profile" className="mt-6 flex items-center justify-center gap-1 border-t border-[hsl(var(--border))] pt-4 text-[11px] font-bold text-[hsl(var(--primary))]">Complete your profile <ArrowRight size={13} /></Link></div><div className="mt-5 rounded-xl bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))]"><div className="eyebrow text-[hsl(var(--sidebar-primary))]">A small prompt</div><p className="serif mt-3 text-2xl leading-6">What are you noticing that others could use?</p><div className="mt-5 text-[10px] text-[hsl(var(--sidebar-foreground)/.55)]">Good notes travel further than polished announcements.</div></div></aside></div></div>;
}

function Profile() {
  const { profile, updateProfile, toast } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const save = () => { updateProfile(draft); setEditing(false); toast('Profile updated — your progress has a new home.'); };
  return <div className="content-wrap"><div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-rise"><div><div className="eyebrow mb-3">Your professional presence</div><h1 className="display-title">Make your work<br /><span className="serif font-normal italic text-[hsl(var(--primary))]">easy to remember.</span></h1></div><button data-testid="button-edit-profile" className="btn btn-outline" onClick={() => { setDraft(profile); setEditing(true); }}><Pencil size={14} /> Edit profile</button></div><div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr]"><section className="card-surface overflow-hidden animate-rise"><div className="h-28 bg-[hsl(var(--sidebar))] relative"><div className="absolute -bottom-8 left-6"><IconAvatar text={initials(profile.name)} size="lg" tone="coral" /></div></div><div className="p-6 pt-12"><h2 data-testid="text-profile-name" className="text-2xl font-bold tracking-[-.05em]">{profile.name}</h2><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{profile.role} · {profile.location}</p><p className="mt-5 max-w-xl text-sm leading-6">{profile.bio}</p><div className="mt-6 flex flex-wrap gap-2">{profile.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></div></section><section className="card-surface animate-rise stagger-1 p-6"><SectionHeading eyebrow="The receipts" title="Learning stats" /><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[hsl(var(--secondary)/.65)] p-4"><div className="metric-number">14</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">hours learned</div></div><div className="rounded-xl bg-[hsl(var(--accent)/.16)] p-4"><div className="metric-number">05</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">day streak</div></div><div className="rounded-xl bg-[hsl(var(--secondary)/.65)] p-4"><div className="metric-number">03</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">paths started</div></div><div className="rounded-xl bg-[hsl(var(--secondary)/.65)] p-4"><div className="metric-number">02</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">credentials</div></div></div></section></div><div className="mt-8 grid gap-7 lg:grid-cols-[1.1fr_.9fr]"><section className="card-surface p-6"><SectionHeading eyebrow="What you can bring" title="Skills in motion" /><div className="space-y-5">{[['Communication', 76], ['Strategic thinking', 58], ['Leadership', 42]].map(([skill, value]) => <div key={String(skill)}><div className="mb-2 flex justify-between text-xs font-semibold"><span>{skill}</span><span className="mono text-[10px] text-[hsl(var(--muted-foreground))]">{value}%</span></div><ProgressBar value={Number(value)} /></div>)}</div></section><section className="card-surface p-6"><SectionHeading eyebrow="Credentials" title="Proof collected" /><div className="space-y-3">{['Product storytelling · May 2024', 'Foundations of facilitation · Apr 2024'].map((credential) => <div key={credential} className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] p-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-[hsl(var(--accent)/.2)] text-[hsl(var(--accent-foreground))]"><Award size={15} /></div><span className="text-xs font-semibold">{credential}</span><Check className="ml-auto text-[hsl(var(--primary))]" size={14} /></div>)}</div></section></div>{editing && <div className="modal-backdrop"><div className="modal animate-rise"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5"><h2 className="text-lg font-bold">Edit your profile</h2><button data-testid="button-close-profile-edit" className="icon-btn" onClick={() => setEditing(false)}><X size={18} /></button></div><div className="space-y-4 p-6"><label className="block text-xs font-bold">Name<input data-testid="input-profile-name" className="form-input mt-2" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label className="block text-xs font-bold">Role<input data-testid="input-profile-role" className="form-input mt-2" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} /></label><label className="block text-xs font-bold">Location<input data-testid="input-profile-location" className="form-input mt-2" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label><label className="block text-xs font-bold">Bio<textarea data-testid="input-profile-bio" className="form-input mt-2 min-h-24 resize-none" value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} /></label><div className="flex justify-end gap-2 pt-2"><button data-testid="button-cancel-profile" className="btn btn-quiet" onClick={() => setEditing(false)}>Cancel</button><button data-testid="button-save-profile" className="btn btn-primary" onClick={save}><Check size={14} /> Save changes</button></div></div></div></div>}</div>;
}

function Notifications() {
  const { notices, markRead, markAllRead } = useApp();
  const iconFor = (type: Notice['type']) => type === 'assessment' ? Target : type === 'achievement' ? Award : type === 'course' ? BookOpen : Heart;
  return <div className="content-wrap"><div className="mb-8 flex items-end justify-between animate-rise"><div><div className="eyebrow mb-3">Your signal</div><h1 className="display-title">Notifications<span className="text-[hsl(var(--accent))]">.</span></h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">The useful nudges, kept in one calm place.</p></div><button data-testid="button-mark-all-read" onClick={markAllRead} className="btn btn-outline">Mark all read</button></div><div className="max-w-3xl card-surface divide-y divide-[hsl(var(--border))]">{notices.map((notice, index) => { const NoticeIcon = iconFor(notice.type); return <button data-testid={`button-notification-${notice.id}`} key={notice.id} onClick={() => markRead(notice.id)} className={`flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-[hsl(var(--secondary)/.4)] ${!notice.read ? 'bg-[hsl(var(--primary)/.035)]' : ''}`}><div className={`mt-0.5 grid h-9 w-9 place-items-center rounded-lg ${!notice.read ? 'bg-[hsl(var(--accent)/.22)] text-[hsl(var(--foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}><NoticeIcon size={16} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className={`text-sm ${!notice.read ? 'font-bold' : 'font-semibold'}`}>{notice.title}</span>{!notice.read && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />}</div><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{notice.body}</p></div><span className="whitespace-nowrap text-[10px] text-[hsl(var(--muted-foreground))]">{notice.time}</span></button> })}</div></div>;
}

function Settings() {
  const { theme, toggleTheme, toast, user, signOut } = useApp();
  const [email, setEmail] = useState(true);
  const [digest, setDigest] = useState(false);
  const Toggle = ({ value, setValue, label }: { value: boolean; setValue: (value: boolean) => void; label: string }) => <button data-testid={`button-toggle-${label.toLowerCase().replace(' ', '-')}`} onClick={() => setValue(!value)} aria-label={label} className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-[hsl(var(--card))] transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} /></button>;
  return <div className="content-wrap"><div className="mb-8 animate-rise"><div className="eyebrow mb-3">Your preferences</div><h1 className="display-title">Make it yours<span className="text-[hsl(var(--accent))]">.</span></h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">A few small choices for a better learning day.</p></div><div className="max-w-3xl space-y-5"><section className="card-surface animate-rise p-6"><div className="mb-5 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--secondary))]"><Sun size={17} /></div><div><h2 className="text-sm font-bold">Appearance</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">Choose the atmosphere for your workspace.</p></div></div><div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-4"><div><div className="text-xs font-semibold">Dark mode</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{theme === 'dark' ? 'Easy on the eyes after hours.' : 'Keep the daylight in.'}</div></div><button data-testid="button-toggle-dark-mode" onClick={() => { toggleTheme(); toast(`${theme === 'dark' ? 'Light' : 'Dark'} mode on.`); }} className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] p-1.5 pr-3 text-[10px] font-bold"><span className={`grid h-7 w-7 place-items-center rounded-full ${theme === 'dark' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--secondary))]'}`}>{theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}</span>{theme === 'dark' ? 'Dark' : 'Light'}</button></div></section><section className="card-surface animate-rise stagger-1 p-6"><div className="mb-5 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--secondary))]"><Bell size={17} /></div><div><h2 className="text-sm font-bold">Notifications</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">Stay close to the moments that move you forward.</p></div></div><div className="divide-y divide-[hsl(var(--border))] border-t border-[hsl(var(--border))]"><div className="flex items-center justify-between py-4"><div><div className="text-xs font-semibold">Learning reminders</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">A gentle nudge when your momentum is waiting.</div></div><Toggle value={email} setValue={setEmail} label="Learning reminders" /></div><div className="flex items-center justify-between py-4"><div><div className="text-xs font-semibold">Weekly reflection</div><div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">A Monday snapshot of your learning footprint.</div></div><Toggle value={digest} setValue={setDigest} label="Weekly reflection" /></div></div></section><section className="card-surface animate-rise stagger-2 p-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--secondary))]"><LogOut size={17} /></div><div><h2 className="text-sm font-bold">Account</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">Signed in as {user?.email}</p></div><button data-testid="button-sign-out" onClick={() => void signOut()} className="btn btn-outline ml-auto">Sign out</button></div></section></div></div>;
}

function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>((localStorage.getItem('prolearn-theme') as 'light' | 'dark') || 'light');
  const [accessibilityMode, setAccessibilityMode] = useState(localStorage.getItem('capacity-connect-accessibility') === 'on');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [courseCatalog, setCourseCatalog] = useState<Course[]>([]);
  const [learningSummary, setLearningSummary] = useState<LearningSummary>({ streak: 0, overallProgress: 0, weeklyMinutes: 0, weeklyActivity: [0, 0, 0, 0, 0, 0, 0], enrolledCourses: [], activities: [] });
  const [learningLoading, setLearningLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [posts, setPosts] = useState(initialPosts);
  const [following, setFollowing] = useState<string[]>([]);
  const [notices, setNotices] = useState(initialNotices);
  const [approvals, setApprovals] = useState<TrainerApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState('');
  const [profile, setProfile] = useState({ name: 'Amina Mensah', role: 'Product operations trainee', location: 'Accra, Ghana', bio: 'I make the messy middle of product work a little clearer. Currently learning in public and collecting better questions.', skills: ['Product thinking', 'Communication', 'Research'] });
  const [toastMessage, setToastMessage] = useState('');
  useEffect(() => {
    void authRequest<{ user: AuthUser }>('/auth/me')
      .then((result) => { setUser(result.user); setProfile({ name: result.user.name, role: roleCopy[result.user.role].label, location: result.user.location, bio: result.user.bio, skills: result.user.skills }); })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setApprovals([]);
      setApplicationsError('');
      setApplicationsLoading(false);
      return;
    }
    let cancelled = false;
    setApplicationsLoading(true);
    setApplicationsError('');
    void authRequest<{ applications: TrainerApplication[] }>('/auth/admin/trainer-applications')
      .then((result) => { if (!cancelled) setApprovals(result.applications); })
      .catch((error) => { if (!cancelled) setApplicationsError(error instanceof Error ? error.message : 'Trainer applications are temporarily unavailable.'); })
      .finally(() => { if (!cancelled) setApplicationsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, user?.role]);
  const refreshLearning = async () => {
    if (!user) return;
    setLearningLoading(true);
    try {
      const catalogResult = await authRequest<{ courses: Course[] }>('/courses');
      setCourseCatalog(catalogResult.courses);
      if (user.role === 'TRAINEE') {
        const summaryResult = await authRequest<LearningSummary>('/learning/summary');
        setLearningSummary(summaryResult);
      } else {
        setLearningSummary({ streak: 0, overallProgress: 0, weeklyMinutes: 0, weeklyActivity: [0, 0, 0, 0, 0, 0, 0], enrolledCourses: [], activities: [] });
      }
    } finally {
      setLearningLoading(false);
    }
  };
  useEffect(() => {
    if (!user) {
      setCourseCatalog([]);
      setLearningSummary({ streak: 0, overallProgress: 0, weeklyMinutes: 0, weeklyActivity: [0, 0, 0, 0, 0, 0, 0], enrolledCourses: [], activities: [] });
      return;
    }
    void refreshLearning().catch(() => undefined);
  }, [user?.id, user?.role]);
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('prolearn-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.classList.toggle('reduced-motion', accessibilityMode); localStorage.setItem('capacity-connect-accessibility', accessibilityMode ? 'on' : 'off'); }, [accessibilityMode]);
  const signIn = async (email: string, password: string, admin = false) => {
    const result = await authRequest<{ user: AuthUser }>(admin ? '/auth/admin/login' : '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setUser(result.user);
    setProfile({ name: result.user.name, role: roleCopy[result.user.role].label, location: result.user.location, bio: result.user.bio, skills: result.user.skills });
    return result.user;
  };
  const signUp = (values: { email: string; password: string; name: string; role: Exclude<Role, 'ADMIN'> }) => authRequest<{ message: string; needsEmailVerification?: boolean; status?: AccountStatus }>('/auth/signup', { method: 'POST', body: JSON.stringify(values) });
  const signOut = async () => { await authRequest<void>('/auth/logout', { method: 'POST' }).catch(() => undefined); setUser(null); };
  const updateApplicationStatus = async (id: string, status: AccountStatus) => {
    const result = await authRequest<{ application: TrainerApplication }>(`/auth/admin/trainer-applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setApprovals((current) => current.map((application) => application.id === id ? result.application : application));
    return result.application;
  };
  const enroll = async (id: string) => {
    await authRequest(`/courses/${id}/enroll`, { method: 'POST' });
    await refreshLearning();
  };
  const advance = async (id: string) => {
    const current = courseCatalog.find((course) => course.id === id)?.progress ?? 0;
    await authRequest(`/courses/${id}/progress`, { method: 'POST', body: JSON.stringify({ progress: Math.min(current + 8, 100), durationMinutes: 15 }) });
    await refreshLearning();
  };
  const enrolled = courseCatalog.filter((course) => course.enrolled).map((course) => course.id);
  const progressFor = (id: string) => courseCatalog.find((course) => course.id === id)?.progress ?? 0;
  const role = user?.role ?? 'TRAINEE';
  const value: AppContextValue = {
    theme, toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
    accessibilityMode, toggleAccessibility: () => setAccessibilityMode((current) => !current),
    user, authLoading, role, signIn, signUp, signOut, courseCatalog, learningSummary, learningLoading,
    globalSearch, setGlobalSearch,
    enrolled, enroll, advance, progressFor,
    posts, react: (id) => setPosts((current) => current.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post)),
    follow: (name) => setFollowing((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]),
    following, publish: (body) => setPosts((current) => [{ id: Date.now(), name: profile.name, role: profile.role, initials: initials(profile.name), time: 'Just now', body, tags: ['#learning-in-public'], likes: 0, comments: 0 }, ...current]),
    notices, markRead: (id) => setNotices((current) => current.map((notice) => notice.id === id ? { ...notice, read: true } : notice)), markAllRead: () => setNotices((current) => current.map((notice) => ({ ...notice, read: true }))),
    approvals, applicationsLoading, applicationsError, updateApplicationStatus,
    profile, updateProfile: setProfile, toast: (message) => { setToastMessage(message); window.setTimeout(() => setToastMessage(''), 2800); },
  };
  return <AppContext.Provider value={value}>{children}{toastMessage && <NoticeToast message={toastMessage} close={() => setToastMessage('')} />}</AppContext.Provider>;
}

function Router() {
  const [location, setLocation] = useLocation();
  const { user, authLoading, role } = useApp();
  if (authLoading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;
  if (['/login', '/admin/login', '/signup'].includes(location)) {
    return <AuthenticatedRedirect role={role} setLocation={setLocation} />;
  }
  return <Shell><ErrorRouteBoundary><Switch><Route path="/" component={Home} /><Route path="/trainee/dashboard" component={role === 'TRAINEE' ? TraineeHome : AccessDenied} /><Route path="/path" component={LearningPath} /><Route path="/learning" component={Learning} /><Route path="/course/:id" component={CourseDetail} /><Route path="/network" component={Network} /><Route path="/trainer/dashboard" component={role === 'TRAINER' ? TrainerDashboard : AccessDenied} /><Route path="/trainer" component={role === 'TRAINER' ? TrainerDashboard : AccessDenied} /><Route path="/sessions" component={role === 'TRAINER' ? TrainerSessions : AccessDenied} /><Route path="/admin/dashboard" component={role === 'ADMIN' ? AdminDashboard : AccessDenied} /><Route path="/admin" component={role === 'ADMIN' ? AdminDashboard : AccessDenied} /><Route path="/insights" component={role === 'ADMIN' ? AdminInsights : AccessDenied} /><Route path="/competencies" component={role === 'ADMIN' || role === 'TRAINER' ? Competencies : AccessDenied} /><Route path="/passport" component={SkillPassport} /><Route path="/verify" component={CertificateVerification} /><Route path="/accessibility" component={Accessibility} /><Route path="/profile" component={Profile} /><Route path="/notifications" component={Notifications} /><Route path="/settings" component={Settings} /><Route component={NotFound} /></Switch></ErrorRouteBoundary></Shell>;
}
function AuthenticatedRedirect({ role, setLocation }: { role: Role; setLocation: (path: string) => void }) {
  useEffect(() => { setLocation(role === 'ADMIN' ? '/admin/dashboard' : role === 'TRAINER' ? '/trainer/dashboard' : '/trainee/dashboard'); }, [role, setLocation]);
  return <LoadingScreen />;
}
function AccessDenied() {
  return <div className="content-wrap"><div className="max-w-xl card-surface p-7"><div className="eyebrow mb-3">Access controlled</div><h1 className="text-2xl font-bold tracking-[-.04em]">This workspace is not part of your role.</h1><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Your account permissions are checked by the server. Return to your workspace to continue.</p><Link href="/" className="btn btn-primary mt-6">Back to workspace <ArrowRight size={14} /></Link></div></div>;
}
function ErrorRouteBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppProvider><Router /></AppProvider></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;