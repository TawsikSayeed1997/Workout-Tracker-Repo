import { ArrowRight, Dumbbell, Flame, Gauge, LogIn, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { isLoginConfigured } from "../../lib/blocks/config";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { Alert } from "../../shared/ui/Alert";
import { LogoMark } from "../../shared/ui/LogoMark";

export function LoginPage({ returnTo }: { returnTo?: string }) {
  const { login } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { t } = useT();
  const configured = isLoginConfigured();

  async function handleLogin() {
    setError(undefined);
    setPending(true);
    try {
      await login(returnTo);
    } catch (caught) {
      setError((caught as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="auth-screen login-screen">
      <div className="login-frame">
        <section className="auth-spotlight" aria-label={t("auth.trainingSpace", "Training space")}>
          <div className="spotlight-grid" aria-hidden="true" />
          <div className="spotlight-glow spotlight-glow-one" aria-hidden="true" />
          <div className="spotlight-glow spotlight-glow-two" aria-hidden="true" />
          <div className="spotlight-topline">
            <div className="auth-brand auth-brand-light">
              <span className="login-logo"><Dumbbell size={21} strokeWidth={2.5} /></span>
              <span>{t("app.name")}</span>
            </div>
            <span className="training-pill"><span className="training-dot" /> {t("auth.trainingReady", "TRAINING READY")}</span>
          </div>

          <div className="spotlight-copy">
            <p className="spotlight-kicker"><Sparkles size={14} /> {t("auth.signInEyebrow", "YOUR TRAINING SPACE")}</p>
            <h1>{t("auth.signInHeadline", "Build strength. Keep score.")}</h1>
            <p>{t("auth.signInDescription", "Log the work, see the pattern, and make every session count.")}</p>
          </div>

          <div className="training-insights" aria-label={t("auth.progressSnapshot", "Progress snapshot")}>
            <div className="insight-tile">
              <span className="insight-icon"><Flame size={17} /></span>
              <strong>01</strong>
              <small>{t("auth.startingPoint", "starting point")}</small>
            </div>
            <div className="insight-tile insight-tile-featured">
              <span className="insight-icon"><TrendingUp size={17} /></span>
              <strong>+24%</strong>
              <small>{t("auth.momentum", "training momentum")}</small>
            </div>
            <div className="insight-tile">
              <span className="insight-icon"><Gauge size={17} /></span>
              <strong>100%</strong>
              <small>{t("auth.inYourHands", "in your hands")}</small>
            </div>
          </div>

          <div className="spotlight-footer">
            <span className="barbell-line" aria-hidden="true"><i /><b /><i /><b /><i /></span>
            <span>{t("auth.trackTheWork", "Track the work. Own the progress.")}</span>
          </div>
        </section>

        <section className="auth-card auth-card--login">
          <div className="auth-card-topline">
            <span>{t("auth.signInLabel", "SIGN IN")}</span>
            <span className="secure-label"><ShieldCheck size={15} /> {t("auth.secure", "Secure access")}</span>
          </div>
          <div className="auth-copy">
            <div className="auth-mobile-mark"><LogoMark size={38} /></div>
            <h2>{t("auth.welcome")}</h2>
            <p>{t("auth.subtitle")}</p>
          </div>
          {!configured ? (
            <Alert tone="warn">
              {t("auth.notConfigured")} <code>{window.location.origin}/login/callback</code>
            </Alert>
          ) : null}
          {error ? <Alert tone="error">{error}</Alert> : null}
          <button className="primary-button auth-submit" disabled={!configured || pending} onClick={handleLogin}>
            <LogIn size={18} /> {pending ? t("auth.redirecting") : t("auth.continue")} <ArrowRight className="auth-button-arrow" size={17} />
          </button>
          <div className="auth-divider"><span>{t("auth.signInDivider", "ONE ACCOUNT. EVERY SESSION.")}</span></div>
          <p className="auth-trust-note"><ShieldCheck size={17} /> {t("auth.trustNote", "Your training data stays connected to your secure Blocks account.")}</p>
          <div className="auth-card-footer">
            <span>{t("auth.noNoise", "No noise. Just progress.")}</span>
            <span className="auth-footer-mark"><span /> {t("auth.readyWhenYouAre", "Ready when you are")}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
