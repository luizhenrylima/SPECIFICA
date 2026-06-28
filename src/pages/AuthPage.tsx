import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoAcervo from '@/assets/logo-acervo-login.png';
import { supabase } from '@/integrations/supabase/client';
import { checkClientRateLimit, rateLimitMessage } from '@/lib/rateLimit';
import { authLoginSchema, authRegisterSchema, emailSchema, firstZodMessage, passwordSchema } from '@/lib/validation';

interface SellerOption {
  user_id: string;
  full_name: string;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'updatePassword';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [sellerLoadError, setSellerLoadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    if (nextMode !== 'register') {
      setFullName('');
      setBirthDate('');
    }
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
      headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }
    }).
    then((res) => setConnStatus(res.ok ? 'ok' : 'error')).
    catch(() => setConnStatus('error'));
  }, []);

  useEffect(() => {
    const loadSellers = async () => {
      const { data, error } = await supabase.rpc('list_sellers');
      if (error) {
        console.error('Failed to load sellers:', error);
        setSellerLoadError('Nao foi possivel carregar vendedores. O cadastro seguira sem vendedor vinculado.');
        return;
      }

      const sellerOptions = (data as SellerOption[] | null) ?? [];
      setSellers(sellerOptions);
      setSellerId(current => current || sellerOptions[0]?.user_id || '');
    };

    void loadSellers();
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
    } else if (mode === 'login') {
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
        navigate('/');
      }
    } else {
      const parsed = authRegisterSchema.safeParse({ email, password, fullName, birthDate, sellerId });
      if (!parsed.success) {
        setError(firstZodMessage(parsed.error));
        setLoading(false);
        return;
      }

      const rate = checkClientRateLimit('auth:register', parsed.data.email);
      if (!rate.allowed) {
        setError(rateLimitMessage(rate));
        setLoading(false);
        return;
      }

      if (!sellerId && !sellerLoadError) {
        setError('Selecione um vendedor para solicitar acesso.');
        setLoading(false);
        return;
      }

      const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName, parsed.data.sellerId, parsed.data.birthDate);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Cadastro realizado com sucesso! Seu acesso sera liberado apos aprovacao do administrador.');
        setEmail('');
        setPassword('');
        setFullName('');
        setBirthDate('');
        setSellerId(sellers[0]?.user_id || '');
        setMode('login');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#333333' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src={logoAcervo}
            alt="Acervo 10.55"
            className="mx-auto h-48 object-contain animate-fade-in"
          />
          <p className="mt-4 text-sm tracking-widest uppercase text-neutral-400">
            Plataforma Exclusiva para Arquitetos
          </p>
          {connStatus === 'error' &&
          <p className="mt-2 text-xs text-red-400 text-center">
              Nao foi possivel conectar ao servidor. Verifique sua internet, desative VPN/extensoes e tente novamente.
            </p>
          }
        </div>

        <div className="rounded-xl p-8 shadow-sm" style={{ backgroundColor: '#3d3d3d', borderColor: '#4a4a4a', borderWidth: '1px' }}>
          <div className="flex mb-8" style={{ borderBottomColor: '#555' , borderBottomWidth: '1px' }}>
            <button
              type="button"
              onClick={() => changeMode('login')}
              className={`flex-1 pb-3 text-xs uppercase tracking-[0.2em] transition-colors ${
              mode === 'login' ? 'text-white border-b-2 border-accent' : 'text-neutral-400'}`
              }>
              Entrar
            </button>
            <button
              type="button"
              onClick={() => changeMode('register')}
              className={`flex-1 pb-3 text-xs uppercase tracking-[0.2em] transition-colors ${
              mode === 'register' ? 'text-white border-b-2 border-accent' : 'text-neutral-400'}`
              }>
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'forgot' && (
              <p className="text-sm leading-relaxed text-neutral-300">
                Informe seu e-mail para receber o link de recuperacao de senha.
              </p>
            )}
            {mode === 'updatePassword' && (
              <p className="text-sm leading-relaxed text-neutral-300">
                Digite uma nova senha para concluir a recuperacao.
              </p>
            )}
            {mode === 'register' &&
            <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">
                  Nome Completo
                </label>
                <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-accent"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a', borderWidth: '1px' }}
                placeholder="Seu nome" />
              </div>
            }
            {mode === 'register' &&
            <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">
                  Data de nascimento
                </label>
                <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-accent"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a', borderWidth: '1px' }} />
              </div>
            }
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">
                  Vendedor responsavel
                </label>
                <select
                  required={!sellerLoadError}
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a', borderWidth: '1px' }}
                  disabled={sellers.length === 0}
                >
                  {sellers.length === 0 ? (
                    <option value="">Nenhum vendedor disponivel</option>
                  ) : (
                    sellers.map(seller => (
                      <option key={seller.user_id} value={seller.user_id}>
                        {seller.full_name}
                      </option>
                    ))
                  )}
                </select>
                {sellerLoadError && (
                  <p className="mt-2 text-xs text-amber-300">{sellerLoadError}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">
                E-mail
              </label>
              <input
                type="email"
                required={mode !== 'updatePassword'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mode === 'updatePassword'}
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-accent"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a', borderWidth: '1px' }}
                placeholder="seu@email.com" />
            </div>
            {mode !== 'forgot' && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-2">
                {mode === 'updatePassword' ? 'Nova senha' : 'Senha'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-accent"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a', borderWidth: '1px' }}
                placeholder="********"
                minLength={6} />
            </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => changeMode('forgot')}
                  className="text-[11px] uppercase tracking-[0.16em] text-neutral-400 transition-colors hover:text-white"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-400 whitespace-pre-line">{error}</p>}
            {success && (
              <div className="p-4 rounded-lg border" style={{ backgroundColor: '#2a3a2a', borderColor: '#4a6a4a' }}>
                <p className="text-sm text-green-400 flex items-start gap-2">
                  <span className="text-lg">...</span>
                  {success}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && sellers.length === 0 && !sellerLoadError)}
              className="w-full py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#ffffff', color: '#333333' }}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Solicitar Acesso' : mode === 'forgot' ? 'Enviar link' : 'Salvar nova senha'}
            </button>
          </form>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => changeMode('login')}
              className="mt-4 w-full text-center text-[11px] uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-white"
            >
              Voltar para login
            </button>
          )}

          {mode === 'register' && (
            <p className="mt-4 text-[11px] text-neutral-500 text-center">
              Apos o cadastro, seu acesso sera analisado e aprovado pelo administrador.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
