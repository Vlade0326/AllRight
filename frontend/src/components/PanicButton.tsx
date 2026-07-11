import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export interface PanicAlert {
  alertId: string;
  userId: string;
  status: 'ACTIVE' | 'RESOLVED';
  lat?: number;
  lon?: number;
  message?: string;
  triggeredAt: string;
  resolvedAt?: string;
}

interface PanicButtonProps {
  coords: { lat: number; lon: number } | null;
  onStatus: (msg: string, isError?: boolean) => void;
}

export function PanicButton({ coords, onStatus }: PanicButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<PanicAlert | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const current = await apiFetch<PanicAlert | null>('/security/panic/active');
        setActive(current);
      } catch {
        // optional
      }
    })();
  }, []);

  async function triggerPanic(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const alert = await apiFetch<PanicAlert>('/security/panic', {
        method: 'POST',
        body: JSON.stringify({
          lat: coords?.lat,
          lon: coords?.lon,
          message: 'SOS — botón de pánico',
        }),
      });
      setActive(alert);
      setConfirmOpen(false);
      onStatus(`Alerta enviada — ID ${alert.alertId.slice(0, 8)}`);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (err) {
      onStatus('Error SOS: ' + (err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }

  async function resolvePanic() {
    if (!active) return;
    setBusy(true);
    try {
      await apiFetch(`/security/panic/${active.alertId}/resolve`, {
        method: 'POST',
      });
      setActive(null);
      onStatus('Alerta de pánico cancelada');
    } catch (err) {
      onStatus('Error al cancelar: ' + (err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {active?.status === 'ACTIVE' ? (
        <div className="panic-active" data-testid="panic-active">
          <p>
            SOS activo · {active.alertId.slice(0, 8)}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={resolvePanic}
            disabled={busy}
            data-testid="panic-resolve-btn"
          >
            Cancelar falsa alarma
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-panic"
          onClick={() => setConfirmOpen(true)}
          data-testid="panic-btn"
        >
          SOS
        </button>
      )}

      {confirmOpen && (
        <div className="panic-modal" data-testid="panic-modal" role="dialog">
          <div className="panic-modal-card">
            <h3>¿Enviar alerta de emergencia?</h3>
            <p>Se notificará a contactos de emergencia con tu ubicación actual.</p>
            <form onSubmit={triggerPanic}>
              <button
                type="submit"
                className="btn-panic"
                disabled={busy}
                data-testid="panic-confirm-btn"
              >
                {busy ? 'Enviando…' : 'Confirmar SOS'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                data-testid="panic-cancel-btn"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
