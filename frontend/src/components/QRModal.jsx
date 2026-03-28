import { useState } from 'react';
import socket from '../socket';
import Avatar from './Avatar';

/**
 * Modal "Partager mon contact" — envoi direct via Socket.io.
 * user : { pseudo, photo, barId, tableId }
 * tables : liste des autres tables actives
 */
export default function ContactModal({ user, tables, onClose }) {
  const [step, setStep]   = useState('form');   // 'form' | 'tables' | 'sent'
  const [type, setType]   = useState('instagram');
  const [value, setValue] = useState('');
  const [sentTo, setSentTo] = useState('');

  function handleNext(e) {
    e.preventDefault();
    if (!value.trim()) return;
    if (tables.length === 0) {
      // no other tables — nothing to send to
      return;
    }
    setStep('tables');
  }

  function handleSend(table) {
    socket.emit('contact:send', {
      barId:     user.barId,
      toTableId: table.tableId,
      pseudo:    user.pseudo,
      photo:     user.photo ?? null,
      contact:   { type, value: value.trim() },
    });
    setSentTo(table.pseudo);
    setStep('sent');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-card rounded-3xl w-full max-w-xs shadow-2xl animate-bounce-in"
        style={{ border: '1px solid rgba(0,153,255,0.25)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <p className="text-white font-black text-base">Partager mon contact</p>
            <p className="text-white/35 text-xs mt-0.5">
              {step === 'tables' ? 'Choisir une table' : step === 'sent' ? 'Contact envoyé !' : 'Votre contact'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 text-xl"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            ✕
          </button>
        </div>

        <div className="p-5">

          {/* ── Step 1 : formulaire contact ── */}
          {step === 'form' && (
            <form onSubmit={handleNext} className="space-y-4">
              {/* Type */}
              <div className="flex gap-2">
                {[
                  { id: 'instagram', label: '📸 Instagram' },
                  { id: 'phone',     label: '📱 Téléphone' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setType(id)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={type === id ? {
                      background: 'linear-gradient(135deg, #0099FF, #00FF87)',
                      color: '#000',
                    } : {
                      background: 'rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Valeur */}
              <input
                type={type === 'phone' ? 'tel' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'instagram' ? '@monpseudo' : '+33 6 12 34 56 78'}
                autoFocus
                className="glass-input w-full rounded-2xl px-4 py-3 text-base"
              />

              <button
                type="submit"
                disabled={!value.trim() || tables.length === 0}
                className="w-full py-3.5 rounded-2xl font-black text-base text-black transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #0099FF, #00FF87)' }}
              >
                {tables.length === 0 ? 'Aucune table active' : 'Choisir une table →'}
              </button>
            </form>
          )}

          {/* ── Step 2 : choisir la table destinataire ── */}
          {step === 'tables' && (
            <div className="space-y-3">
              <p className="text-white/40 text-xs text-center mb-1">
                {type === 'instagram' ? '📸' : '📱'} <span className="text-white/70 font-semibold">{value}</span> sera envoyé à :
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tables.map((table) => (
                  <button
                    key={table.tableId}
                    onClick={() => handleSend(table)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-95 text-left"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border:     '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    <Avatar pseudo={table.pseudo} photo={table.photo} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{table.pseudo}</p>
                      <p className="text-white/35 text-xs">Table {table.tableId}</p>
                    </div>
                    <span
                      className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl text-black"
                      style={{ background: 'linear-gradient(135deg, #0099FF, #00FF87)' }}
                    >
                      Envoyer
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('form')}
                className="w-full py-2.5 rounded-xl text-sm text-white/50 font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                ← Modifier
              </button>
            </div>
          )}

          {/* ── Step 3 : confirmation envoi ── */}
          {step === 'sent' && (
            <div className="text-center py-2">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-white font-black text-base mb-1">Contact envoyé !</p>
              <p className="text-white/40 text-sm mb-5">
                <span className="font-semibold text-white/60">{sentTo}</span> a reçu vos coordonnées
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-black text-base text-black"
                style={{ background: 'linear-gradient(135deg, #0099FF, #00FF87)' }}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
