import { CheckCircle2, KeyRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { blocksClient } from "../../lib/blocks/client";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { Alert } from "../../shared/ui/Alert";
import { LogoMark } from "../../shared/ui/LogoMark";

type ActivationPageProps = {
  code: string;
  onNavigate: (path: string) => void;
};

function responseRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  if (record.data && typeof record.data === "object") return record.data as Record<string, unknown>;
  return record;
}

function getText(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function responseError(record: Record<string, unknown>): string {
  const errors = record.errors;
  if (errors && typeof errors === "object") {
    const messages = Object.values(errors as Record<string, unknown>).filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
    if (messages.length) return messages.join(" ");
  }
  return "";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "We could not complete this activation. Please request a new invitation from your administrator.";
}

export function ActivationPage({ code, onNavigate }: ActivationPageProps) {
  const { t } = useT();
  const [checking, setChecking] = useState(Boolean(code));
  const [valid, setValid] = useState(false);
  const [checkError, setCheckError] = useState<string>();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [activationError, setActivationError] = useState<string>();
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!code) {
      setChecking(false);
      setCheckError(t("auth.missingCode"));
      return () => { cancelled = true; };
    }

    setChecking(true);
    blocksClient.auth.validateActivation({ activationCode: code }).then((result) => {
      if (cancelled) return;
      const record = responseRecord(result);
      const failure = responseError(record);
      const validity = record.valid ?? record.isValid ?? record.IsValid;
      if (record.isSuccess === false || record.success === false || validity === false || failure) {
        setCheckError(failure || t("auth.invalidInvitation"));
        setValid(false);
        return;
      }
      setFirstName(getText(record, "firstName", "FirstName"));
      setLastName(getText(record, "lastName", "LastName"));
      setValid(true);
    }).catch((error: unknown) => {
      if (cancelled) return;
      setCheckError(errorMessage(error));
      setValid(false);
    }).finally(() => {
      if (!cancelled) setChecking(false);
    });

    return () => { cancelled = true; };
  }, [code, t]);

  const passwordMismatch = useMemo(
    () => Boolean(confirmPassword) && password !== confirmPassword,
    [confirmPassword, password]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActivationError(undefined);
    if (passwordMismatch) {
      setActivationError(t("auth.passwordMismatch"));
      return;
    }

    setPending(true);
    try {
      // IAM's endpoints use different names here: validation accepts
      // `activationCode`, while the final activation endpoint requires `code`.
      const result = responseRecord(await blocksClient.auth.activate({ code, email, password, firstName, lastName }));
      const failure = responseError(result);
      if (result.isSuccess === false || result.success === false || failure) {
        throw new Error(failure || t("auth.activationRejected"));
      }
      setActivated(true);
    } catch (error: unknown) {
      setActivationError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card activation-card">
        <div className="auth-brand"><LogoMark /><span>{t("app.name")}</span></div>
        {activated ? (
          <>
            <div className="activation-success"><CheckCircle2 size={30} /></div>
            <h2>{t("auth.accountActivated")}</h2>
            <p>{t("auth.accountReady")}</p>
            <button className="primary-button auth-submit" onClick={() => onNavigate("/login")}>{t("auth.goToSignIn")}</button>
          </>
        ) : (
          <>
            <div className="activation-heading"><KeyRound size={19} /><span>{t("auth.finishAccount")}</span></div>
            <h2>{t("auth.createPassword")}</h2>
            <p>{t("auth.activationSubtitle")}</p>
            {checking ? <Alert tone="info">{t("auth.checkingInvitation")}</Alert> : null}
            {checkError ? <Alert tone="error">{checkError}</Alert> : null}
            {activationError ? <Alert tone="error">{activationError}</Alert> : null}
            {valid && !checking ? (
              <form className="activation-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="form-field activation-email"><span>{t("auth.email")}</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                  <label className="form-field"><span>{t("auth.firstName")}</span><input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
                  <label className="form-field"><span>{t("auth.lastName")}</span><input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
                  <label className="form-field"><span>{t("auth.password")}</span><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                  <label className="form-field"><span>{t("auth.confirmPassword")}</span><input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
                </div>
                <p className="activation-hint">{t("auth.passwordHint")}</p>
                <button className="primary-button auth-submit" disabled={pending || passwordMismatch} type="submit">{pending ? t("auth.activating") : t("auth.activate")}</button>
              </form>
            ) : null}
            <button className="link-button activation-back" onClick={() => onNavigate("/login")}>Back to sign in</button>
          </>
        )}
      </div>
    </div>
  );
}
