import { ProofHistoryItem } from '../api/client';

function formatHistoryTime(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ProofHistoryProps {
  items: ProofHistoryItem[];
  onRefresh: () => void;
}

export function ProofHistory({ items, onRefresh }: ProofHistoryProps) {
  return (
    <section className="history-panel" data-testid="proof-history">
      <div className="history-header">
        <h2>Historial proofs</h2>
        <button
          className="btn-icon btn-refresh"
          onClick={onRefresh}
          title="Actualizar"
          data-testid="refresh-history"
          type="button"
        >
          ↻
        </button>
      </div>
      <ul className="history-list">
        {!items.length ? (
          <li className="history-empty">Sin registros aún</li>
        ) : (
          items.map((item) => {
            const isProve = item.action === 'ZKP_PROVE';
            const label = isProve ? 'Prove' : 'Verify';
            const zone = item.isInside ? 'en zona' : 'fuera';
            const extra = isProve
              ? item.adapter || 'commitment'
              : item.valid
                ? 'válido'
                : 'inválido';

            return (
              <li key={item.id} data-testid="history-item">
                <span className={`history-action${isProve ? '' : ' verify'}`}>{label}</span>
                <span className="history-meta">
                  {zone} · {extra}
                </span>
                <span className="history-time">{formatHistoryTime(item.timestamp)}</span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
