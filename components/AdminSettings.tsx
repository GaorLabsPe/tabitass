import React, { useState } from 'react';
import { AdminSettings } from '../types';
import { Save, Lock, MessageSquare, Landmark, ShieldCheck } from 'lucide-react';

interface AdminSettingsPanelProps {
  settings: AdminSettings;
  adminPassword: string;
  onUpdateSettings: (settings: AdminSettings) => void;
  onUpdatePassword: (password: string) => void;
}

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  settings,
  adminPassword,
  onUpdateSettings,
  onUpdatePassword,
}) => {
  // Local states
  const [companyName, setCompanyName] = useState<string>(settings.companyName);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(settings.whatsappNumber);
  const [yapeNumber, setYapeNumber] = useState<string>(settings.yapeNumber);
  const [yapeName, setYapeName] = useState<string>(settings.yapeName);
  const [plinNumber, setPlinNumber] = useState<string>(settings.plinNumber);
  const [plinName, setPlinName] = useState<string>(settings.plinName);
  const [advanceTypeRule, setAdvanceTypeRule] = useState<AdminSettings['advanceTypeRule']>(settings.advanceTypeRule || 'flat');
  const [flatAdvanceAmount, setFlatAdvanceAmount] = useState<number>(settings.flatAdvanceAmount !== undefined ? settings.flatAdvanceAmount : 35);

  const [password, setPassword] = useState<string>(adminPassword);
  const [confirmPassword, setConfirmPassword] = useState<string>(adminPassword);

  const [successMsg, setSuccessMsg] = useState<string>('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState<string>('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !whatsappNumber) {
      alert('Nombre de empresa y WhatsApp son requeridos.');
      return;
    }

    onUpdateSettings({
      companyName,
      whatsappNumber,
      yapeNumber,
      yapeName,
      plinNumber,
      plinName,
      advanceTypeRule,
      flatAdvanceAmount,
    });

    setSuccessMsg('✅ ¡Ajustes de la tienda guardados correctamente!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      alert('La contraseña no puede estar vacía.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    onUpdatePassword(password);
    setPwdSuccessMsg('🔑 ¡Contraseña de administrador actualizada con éxito!');
    setTimeout(() => setPwdSuccessMsg(''), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Block 1: Store Setup */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-slate-900 font-display">Configuración de Contacto & Yape/Plin</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombre de la Tienda</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej. Tabitas Store"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">WhatsApp receptor de pedidos (Código país + número sin espacios)</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Ej. 51987654321 (51 de Perú)"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Es muy importante ingresar el prefijo del país (ej: *51* para Perú). Sin este prefijo, el botón wa.me no abrirá correctamente en dispositivos móviles.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Yape details */}
            <div className="space-y-3 bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/30">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" /> Cuenta Yape
              </span>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Número Yape</label>
                <input
                  type="text"
                  value={yapeNumber}
                  onChange={(e) => setYapeNumber(e.target.value)}
                  placeholder="987654321"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Titular Yape</label>
                <input
                  type="text"
                  value={yapeName}
                  onChange={(e) => setYapeName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Plin details */}
            <div className="space-y-3 bg-cyan-50/20 p-3 rounded-xl border border-cyan-100/30">
              <span className="text-[10px] uppercase font-bold text-cyan-600 tracking-wider flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" /> Cuenta Plin
              </span>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Número Plin</label>
                <input
                  type="text"
                  value={plinNumber}
                  onChange={(e) => setPlinNumber(e.target.value)}
                  placeholder="912345678"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Titular Plin</label>
                <input
                  type="text"
                  value={plinName}
                  onChange={(e) => setPlinName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Rules of Advance Payment (Reglas de Adelanto) */}
          <div className="bg-orange-50/30 p-4 rounded-xl border border-orange-100/50 space-y-3">
            <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Reglas de Adelanto para Reservas (Clientes Generales)
            </span>
            <p className="text-[10px] text-slate-500 leading-normal">
              Define cómo calcular el adelanto para clientes generales. Las personas de confianza (conocidos o compañeros de trabajo) siempre podrán reservar con <strong>S/ 0 de adelanto</strong> al registrar su pedido.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Método de Cálculo</label>
                <select
                  value={advanceTypeRule}
                  onChange={(e) => setAdvanceTypeRule(e.target.value as AdminSettings['advanceTypeRule'])}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-orange-500"
                >
                  <option value="flat">Monto Fijo General (Ej. S/ 35)</option>
                  <option value="calculated">Calculado por Producto</option>
                </select>
              </div>

              {advanceTypeRule === 'flat' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Monto de Adelanto Fijo (S/)</label>
                  <input
                    type="number"
                    min="0"
                    value={flatAdvanceAmount}
                    onChange={(e) => setFlatAdvanceAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}
            </div>
          </div>

          {successMsg && <div className="text-xs text-emerald-600 font-bold mt-2">{successMsg}</div>}

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 mt-4"
          >
            <Save className="w-4 h-4" />
            Guardar Ajustes de Tienda
          </button>
        </form>
      </div>

      {/* Block 2: Security settings */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <Lock className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-slate-900 font-display">Seguridad del Panel Admin</h3>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nueva Contraseña de Acceso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Escribe la nueva contraseña"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
            />
          </div>

          {pwdSuccessMsg && <div className="text-xs text-emerald-600 font-bold mt-2">{pwdSuccessMsg}</div>}

          <div className="flex gap-2.5 p-3.5 bg-orange-50 border border-orange-100 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-[11px] text-slate-600 leading-normal">
              La contraseña modificada se guardará de forma persistente. Recuerda tu contraseña para no perder acceso al panel de control de inventarios.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
          >
            <Save className="w-4 h-4" />
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
};
