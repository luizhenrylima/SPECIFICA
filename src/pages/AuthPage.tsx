import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoSpecifica from '@/assets/logo-specifica.png';
import { supabase } from '@/integrations/supabase/client';
import { checkClientRateLimit, rateLimitMessage } from '@/lib/rateLimit';
import { authLoginSchema, emailSchema, firstZodMessage, passwordSchema } from '@/lib/validation';

type AuthMode = 'login' | 'forgot' | 'updatePassword';

async function resolvePostLoginPath() {
  const { data: isMasterAdmin } = await (supabase.rpc as any)('is_master_admin');
  if (isMasterAdmin) return '/admin';

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return '/catalog';

  const { data: memberships } = await (supabase as any)
    .from('store_members')
    .select('role, status, store_id, created_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  const role = memberships?.[0]?.role;
  if (role === 'store_admin' || role === 'manager') return '/admin-loja';
  if (role === 'seller') return '/rotina';
  if (role === 'financial' || role === 'finance') return '/financeiro';
  return '/catalog';
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    if (nextMode === 'forgot') {
      setPassword('');
    }
  };

  useEffect(() => {
    const shouldShowPasswordUpdate =
      new URLSearchParams(window.location.search).get('reset') === 'password' ||
      window.location.hash.includes('type=recovery');

    if (shouldShowPasswordUpdate) {
      setMode('updatePassword');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('updatePassword');
        setError('');
        setSuccess('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then((res) => setConnStatus(res.ok ? 'ok' : 'error'))
      .catch(() => setConnStatus('error'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'forgot') {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) {
        setError(firstZodMessage(parsed.error));
        setLoading(false);
        return;
      }

      const rate = checkClientRateLimit('auth:password-reset', parsed.data);
      if (!rate.allowed) {
        setError(rateLimitMessage(rate));
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/auth?reset=password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Enviamos um link de recuperacao para o e-mail informado. Verifique sua caixa de entrada.');
      }
    } else if (mode === 'updatePassword') {
      const parsed = passwordSchema.safeParse(password);
      if (!parsed.success) {
        setError(firstZodMessage(parsed.error));
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) {
        setError(error.message);
      } else {
        setPassword('');
        setSuccess('Senha atualizada com sucesso. Entre novamente com sua nova senha.');
        window.history.replaceState({}, document.title, '/auth');
        await supabase.auth.signOut();
        setMode('login');
      }
    } else {
      const parsed = authLoginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(firstZodMessage(parsed.error));
        setLoading(false);
        return;
      }

      const rate = checkClientRateLimit('auth:login', parsed.data.email);
      if (!rate.allowed) {
        setError(rateLimitMessage(rate));
        setLoading(false);
        return;
      }

      const { error } = await signIn(parsed.data.email, parsed.data.password);
      if (error) {
        setError(error.message);
      } else {
        navigate(await resolvePostLoginPath());
      }
    }

    setLoading(false);
  };

  const submitLabel =
    mode === 'login' ? 'Entrar' : mode === 'forgot' ? 'Enviar link' : 'Salvar nova senha';

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 text-neutral-950">
      <section className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <img
            src={logoSpecifica}
            alt="SPECIFICA"
            className="mx-auto h-40 w-auto object-contain sm:h-44"
          />
          {connStatus === 'error' && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
              Nao foi possivel conectar ao servidor. Verifique sua internet, desative VPN/extensoes e tente novamente.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          {mode === 'forgot' && (
            <p className="text-sm leading-relaxed text-neutral-600">
              Informe seu e-mail para receber o link de recuperacao de senha.
            </p>
          )}
          {mode === 'updatePassword' && (
            <p className="text-sm leading-relaxed text-neutral-600">
              Digite uma nova senha para concluir a recuperacao.
            </p>
          )}

          {mode !== 'updatePassword' && (
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 placeholder:text-neutral-400 outline-none transition focus:border-neutral-950"
                placeholder="seu@email.com"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                {mode === 'updatePassword' ? 'Nova senha' : 'Senha'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 placeholder:text-neutral-400 outline-none transition focus:border-neutral-950"
                placeholder="********"
                minLength={6}
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => changeMode('forgot')}
                className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-neutral-950"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>}
          {success && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-neutral-950 px-4 py-3.5 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : submitLabel}
          </button>
        </form>

        {mode !== 'login' && (
          <button
            type="button"
            onClick={() => changeMode('login')}
            className="mt-4 w-full text-center text-[11px] uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-neutral-950"
          >
            Voltar para login
          </button>
        )}
      </section>
    </main>
  );
}
