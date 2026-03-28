import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, loginError, isLoading, clearError } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [touched,  setTouched]  = useState({ email: false, password: false });
  const [shake,    setShake]    = useState(false);

  const emailRef = useRef(null);

  /* Focus the email field on mount */
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  /* Shake the card whenever a login error appears */
  useEffect(() => {
    if (loginError) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [loginError]);

  /* Clear server error when the user starts retyping */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (loginError) clearError();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (loginError) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email.trim() || !password) return;
    await login(email, password);
  };

  /* Inline validation */
  const emailInvalid    = touched.email    && !email.trim();
  const passwordInvalid = touched.password && !password;

  return (
    <div className="lp-shell">
      {/* Left panel — branding */}
      <div className="lp-brand">
        <div className="lp-brand-inner">
          <div className="lp-logo">
            <div className="lp-logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12" />
              </svg>
            </div>
            <div>
              <div className="lp-logo-name">StreetSense</div>
              <div className="lp-logo-sub">Admin Portal</div>
            </div>
          </div>

          <div className="lp-brand-body">
            <h1 className="lp-tagline">
              Atlanta's road network,<br />under your control.
            </h1>
            <p className="lp-desc">
              Manage pothole reports, dispatch repair crews, track SLA compliance,
              and keep Atlanta's streets safe — all from one place.
            </p>
          </div>

          <div className="lp-stats">
            <div className="lp-stat">
              <div className="lp-stat-val">142</div>
              <div className="lp-stat-lbl">Active reports</div>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat">
              <div className="lp-stat-val">58</div>
              <div className="lp-stat-lbl">Fixed this month</div>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat">
              <div className="lp-stat-val">31</div>
              <div className="lp-stat-lbl">Critical pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="lp-form-side">
        <div className={`lp-card${shake ? ' shake' : ''}`}>

          <div className="lp-card-header">
            <h2 className="lp-card-title">Sign in to your account</h2>
            <p className="lp-card-sub">
              Use your Atlanta city government credentials.
            </p>
          </div>

          <form className="lp-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-email">
                Email address
              </label>
              <div className={`lp-input-wrap${emailInvalid ? ' invalid' : ''}`}>
                <svg className="lp-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 5h16v11a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"/>
                  <path d="M2 5l8 7 8-7"/>
                </svg>
                <input
                  ref={emailRef}
                  id="lp-email"
                  type="email"
                  className="lp-input"
                  placeholder="you@atlantaga.gov"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </div>
              {emailInvalid && (
                <span className="lp-field-error">Email is required.</span>
              )}
            </div>

            {/* Password */}
            <div className="lp-field">
              <div className="lp-label-row">
                <label className="lp-label" htmlFor="lp-password">
                  Password
                </label>
                <button
                  type="button"
                  className="lp-forgot"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <div className={`lp-input-wrap${passwordInvalid ? ' invalid' : ''}`}>
                <svg className="lp-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="9" width="14" height="9" rx="2"/>
                  <path d="M7 9V6a3 3 0 016 0v3"/>
                </svg>
                <input
                  id="lp-password"
                  type={showPw ? 'text' : 'password'}
                  className="lp-input lp-input-pw"
                  placeholder="Your password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="lp-pw-toggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPw ? (
                    /* Eye-off */
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3l14 14M8.46 8.46A3 3 0 0011.54 11.54"/>
                      <path d="M10.58 5.06A8.6 8.6 0 0110 5C5 5 1.73 10 1.73 10a14.7 14.7 0 003.04 3.61M7.51 7.51A8.57 8.57 0 0010 15c5 0 8.27-5 8.27-5a14.74 14.74 0 00-3.78-3.73"/>
                    </svg>
                  ) : (
                    /* Eye */
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1.73 10S5 5 10 5s8.27 5 8.27 5S15 15 10 15 1.73 10 1.73 10z"/>
                      <circle cx="10" cy="10" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {passwordInvalid && (
                <span className="lp-field-error">Password is required.</span>
              )}
            </div>

            {/* Server error */}
            {loginError && (
              <div className="lp-error-banner" role="alert">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="8"/>
                  <path d="M10 6v4M10 13.5v.5"/>
                </svg>
                {loginError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="lp-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="lp-spinner" />
                  Signing in…
                </>
              ) : (
                'Sign in to dashboard'
              )}
            </button>

          </form>

          {/* Demo hint */}
          <div className="lp-demo-hint">
            <span className="lp-demo-label">Demo credentials</span>
            <button
              type="button"
              className="lp-demo-fill"
              onClick={() => {
                setEmail('j.lewis@atlantaga.gov');
                setPassword('StreetsATL2026!');
                clearError();
              }}
            >
              Fill in demo account ↗
            </button>
          </div>

        </div>

        <p className="lp-footer">
          StreetSense Admin · Atlanta, GA · For authorized city personnel only.
        </p>
      </div>
    </div>
  );
}
