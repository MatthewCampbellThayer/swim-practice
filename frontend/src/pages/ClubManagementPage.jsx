import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ClubManagementPage() {
  const navigate = useNavigate();
  const { isSuper } = useAuth();
  const [tab, setTab] = useState('clubs');
  const [clubs, setClubs] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [editClub, setEditClub] = useState(null);
  const [editCoach, setEditCoach] = useState(null);
  const [editSwimmer, setEditSwimmer] = useState(null);
  const [selectedClubForSwimmers, setSelectedClubForSwimmers] = useState('');

  if (!isSuper) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-xl">
      Superuser access required.
    </div>
  );

  useEffect(() => { api.clubs.all().then(setClubs); }, []);
  useEffect(() => { if (tab === 'coaches') api.coaches.list().then(setCoaches); }, [tab]);
  useEffect(() => {
    if (tab === 'swimmers' && selectedClubForSwimmers) {
      api.swimmers.list(selectedClubForSwimmers).then(setSwimmers);
    }
  }, [tab, selectedClubForSwimmers]);

  // --- Clubs ---
  async function saveClub(data) {
    if (data.id) { const d = await api.clubs.update(data.id, data); setClubs(p => p.map(c => c.id === d.id ? d : c)); }
    else { const d = await api.clubs.create(data); setClubs(p => [...p, d]); }
    setEditClub(null);
  }
  async function deleteClub(id) {
    if (!confirm('Delete this club?')) return;
    await api.clubs.delete(id); setClubs(p => p.filter(c => c.id !== id));
  }

  // --- Coaches ---
  async function saveCoach(data) {
    if (data.id) { const d = await api.coaches.update(data.id, data); setCoaches(p => p.map(c => c.id === d.id ? d : c)); }
    else { const d = await api.coaches.create(data); setCoaches(p => [...p, d]); }
    setEditCoach(null);
  }
  async function deleteCoach(id) {
    if (!confirm('Delete this coach?')) return;
    await api.coaches.delete(id); setCoaches(p => p.filter(c => c.id !== id));
  }

  // --- Swimmers ---
  async function saveSwimmer(data) {
    if (data.id) { const d = await api.swimmers.update(data.id, data); setSwimmers(p => p.map(s => s.id === d.id ? d : s)); }
    else { const d = await api.swimmers.create({ ...data, club_id: selectedClubForSwimmers }); setSwimmers(p => [...p, d]); }
    setEditSwimmer(null);
  }
  async function deleteSwimmer(id) {
    if (!confirm('Delete this swimmer?')) return;
    await api.swimmers.delete(id); setSwimmers(p => p.filter(s => s.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-blue-300 hover:text-white">← Back</button>
        <h1 className="text-xl font-bold">Club Management</h1>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b flex">
        {['clubs', 'coaches', 'swimmers'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 ${tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto p-4">

        {/* CLUBS */}
        {tab === 'clubs' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Clubs ({clubs.length})</h2>
              <button onClick={() => setEditClub({})} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Add Club</button>
            </div>
            <div className="space-y-2">
              {clubs.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-gray-500 text-sm">{c.zipcode}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditClub(c)} className="text-blue-600 text-sm hover:underline">Edit</button>
                    <button onClick={() => deleteClub(c.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {editClub !== null && (
              <ClubForm initial={editClub} onSave={saveClub} onClose={() => setEditClub(null)} />
            )}
          </>
        )}

        {/* COACHES */}
        {tab === 'coaches' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Coaches ({coaches.length})</h2>
              <button onClick={() => setEditCoach({})} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Add Coach</button>
            </div>
            <div className="space-y-2">
              {coaches.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{c.last_name}, {c.first_name} {c.is_superuser && <span className="text-xs bg-indigo-100 text-indigo-700 rounded px-1 ml-1">Super</span>}</div>
                    <div className="text-gray-500 text-sm">{c.cell} · {c.email}</div>
                    <div className="text-blue-600 text-xs mt-0.5">{c.coach_clubs?.map(cc => cc.club?.name).join(', ')}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditCoach(c)} className="text-blue-600 text-sm hover:underline">Edit</button>
                    <button onClick={() => deleteCoach(c.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {editCoach !== null && (
              <CoachForm initial={editCoach} clubs={clubs} onSave={saveCoach} onClose={() => setEditCoach(null)} />
            )}
          </>
        )}

        {/* SWIMMERS */}
        {tab === 'swimmers' && (
          <>
            <div className="flex gap-3 mb-4 items-center">
              <select value={selectedClubForSwimmers} onChange={e => setSelectedClubForSwimmers(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a club...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {selectedClubForSwimmers && (
                <button onClick={() => setEditSwimmer({})} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Add Swimmer</button>
              )}
            </div>
            {selectedClubForSwimmers && (
              <div className="space-y-2">
                {swimmers.map(s => (
                  <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{s.last_name}, {s.first_name}</div>
                      <div className="text-gray-500 text-sm">{s.cell} · {s.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditSwimmer(s)} className="text-blue-600 text-sm hover:underline">Edit</button>
                      <button onClick={() => deleteSwimmer(s.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editSwimmer !== null && (
              <SwimmerForm initial={editSwimmer} onSave={saveSwimmer} onClose={() => setEditSwimmer(null)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ClubForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ name: initial.name || '', zipcode: initial.zipcode || '', ...initial });
  return (
    <Modal title={initial.id ? 'Edit Club' : 'Add Club'} onClose={onClose}>
      <div className="space-y-3">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Club Name"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={form.zipcode} onChange={e => setForm(f => ({ ...f, zipcode: e.target.value }))} placeholder="Zipcode"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-semibold">Save</button>
          <button onClick={onClose} className="px-4 text-gray-500">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

function CoachForm({ initial, clubs, onSave, onClose }) {
  const initialClubIds = initial.coach_clubs?.map(cc => cc.club_id) || [];
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', cell: '', is_superuser: false, ...initial, club_ids: initialClubIds });
  function toggleClub(id) {
    setForm(f => ({ ...f, club_ids: f.club_ids.includes(id) ? f.club_ids.filter(c => c !== id) : [...f.club_ids, id] }));
  }
  return (
    <Modal title={initial.id ? 'Edit Coach' : 'Add Coach'} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First Name"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last Name"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={form.cell} onChange={e => setForm(f => ({ ...f, cell: e.target.value }))} placeholder="Cell #"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Clubs</label>
          {clubs.map(c => (
            <label key={c.id} className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" checked={form.club_ids.includes(c.id)} onChange={() => toggleClub(c.id)} />
              <span className="text-sm">{c.name}</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_superuser} onChange={e => setForm(f => ({ ...f, is_superuser: e.target.checked }))} />
          <span className="text-sm font-medium">Superuser</span>
        </label>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-semibold">Save</button>
          <button onClick={onClose} className="px-4 text-gray-500">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

function SwimmerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', cell: '', ...initial });
  return (
    <Modal title={initial.id ? 'Edit Swimmer' : 'Add Swimmer'} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First Name"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last Name"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={form.cell} onChange={e => setForm(f => ({ ...f, cell: e.target.value }))} placeholder="Cell #"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-semibold">Save</button>
          <button onClick={onClose} className="px-4 text-gray-500">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
