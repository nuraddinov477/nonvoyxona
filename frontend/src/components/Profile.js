import { useState, useEffect } from 'react';
import api from '../api/axios';
import { MdClose, MdPerson, MdPhone, MdWork, MdAttachMoney, MdCalendarToday, MdLocationOn, MdBadge } from 'react-icons/md';

const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(parseFloat(n) || 0) + " so'm";

export default function Profile({ open, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get('/auth/profile/').then(r => setProfile(r.data)).finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username;
  const emp = profile?.employee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header with avatar */}
        <div className="bg-gradient-to-br from-bread-500 to-bread-700 text-white p-6 text-center relative">
          <button onClick={onClose}
            className="absolute top-3 right-3 hover:bg-white/20 p-1 rounded">
            <MdClose size={22} />
          </button>
          <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold mb-2 border-4 border-white/30">
            {initials}
          </div>
          <h2 className="text-xl font-bold">{fullName}</h2>
          <p className="text-sm opacity-90">@{profile?.username}</p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {loading && <p className="text-center text-gray-400">Yuklanmoqda...</p>}

          {profile && (
            <>
              <InfoRow icon={MdBadge} label="Rol" value={profile.role_display} />
              {profile.phone && (
                <InfoRow icon={MdPhone} label="Telefon" value={profile.phone} />
              )}

              {emp && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <h3 className="text-xs uppercase font-semibold text-gray-500 mb-2">
                      Xodim ma'lumotlari
                    </h3>
                  </div>
                  {emp.position && (
                    <InfoRow icon={MdWork} label="Lavozim" value={emp.position} />
                  )}
                  {emp.salary_type && (
                    <InfoRow icon={MdAttachMoney} label="Maosh turi" value={emp.salary_type} />
                  )}
                  {emp.fixed_salary > 0 && (
                    <InfoRow icon={MdAttachMoney} label="Asosiy maosh"
                      value={formatMoney(emp.fixed_salary)} valueClass="text-green-600 font-semibold" />
                  )}
                  {emp.hire_date && (
                    <InfoRow icon={MdCalendarToday} label="Ishga kirgan"
                      value={new Date(emp.hire_date).toLocaleDateString('uz-UZ')} />
                  )}
                  {emp.address && (
                    <InfoRow icon={MdLocationOn} label="Manzil" value={emp.address} />
                  )}
                  <InfoRow icon={MdPerson} label="Holat" value={emp.status} />
                </>
              )}

              {profile.date_joined && (
                <InfoRow icon={MdCalendarToday} label="Akkaunt yaratilgan"
                  value={new Date(profile.date_joined).toLocaleDateString('uz-UZ')} />
              )}
            </>
          )}
        </div>

        <div className="bg-gray-50 px-5 py-3 text-center">
          <button onClick={onClose}
            className="text-bread-600 hover:text-bread-700 text-sm font-medium">
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueClass = 'text-gray-800' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-bread-50 flex items-center justify-center text-bread-600 flex-shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm ${valueClass} truncate`}>{value}</p>
      </div>
    </div>
  );
}
