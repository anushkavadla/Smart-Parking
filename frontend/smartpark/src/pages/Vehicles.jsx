import { useEffect, useState } from 'react';
import { vehicleService } from '../api/services';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import Modal from '../components/Modal';
import VehicleCard from '../components/VehicleCard';

const TYPES = ['CAR', 'TWO_WHEELER', 'HEAVY_VEHICLE'];

const emptyForm = { vehicleNumber: '', vehicleType: 'CAR', brand: '', model: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'add' | vehicle object | null
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState('');

  async function load() {
    setError('');
    try {
      setVehicles(await vehicleService.list());
    } catch (err) {
      setError(err.message || 'Could not load vehicles.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setFormError('');
    setModal('add');
  }

  function openEdit(v) {
    setForm({
      vehicleNumber: v.vehicleNumber ?? '',
      vehicleType: v.vehicleType ?? 'CAR',
      brand: v.brand ?? '',
      model: v.model ?? '',
    });
    setFormError('');
    setModal(v);
  }

  async function save() {
    if (!form.vehicleNumber.trim()) {
      setFormError('Vehicle number is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        vehicleType: form.vehicleType,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
      };
      if (modal === 'add') await vehicleService.create(payload);
      else await vehicleService.update(modal.id, payload);
      setModal(null);
      setNotice(modal === 'add' ? 'Vehicle added.' : 'Vehicle updated.');
      await load();
    } catch (err) {
      setFormError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(v) {
    if (!window.confirm(`Delete vehicle ${v.vehicleNumber}?`)) return;
    setDeletingId(v.id);
    setNotice('');
    try {
      await vehicleService.remove(v.id);
      setNotice('Vehicle deleted.');
      await load();
    } catch (err) {
      setNotice(err.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  if (error && !vehicles) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }
  if (!vehicles) {
    return (
      <div className="page">
        <LoadingState label="Loading vehicles…" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Garage</p>
          <h1 className="page-title">My vehicles</h1>
          <p className="page-sub">
            Register every vehicle you drive. Bay sizes are matched to vehicle
            class at check-in.
          </p>
        </div>
        <Button onClick={openAdd}>+ Add vehicle</Button>
      </div>

      {notice && <div className="form-success">{notice}</div>}

      {vehicles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="▣"
            title="No vehicles yet"
            hint="Add your first vehicle — for example, Hyundai Creta · TS 09 AB 5678 · CAR."
            action={{ label: 'Add vehicle', onClick: openAdd }}
          />
        </div>
      ) : (
        <div className="grid-3">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onEdit={openEdit}
              onDelete={remove}
              deleting={deletingId === v.id}
            />
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Add vehicle' : `Edit ${modal.vehicleNumber}`}
          onClose={() => setModal(null)}
        >
          {formError && <div className="form-error">{formError}</div>}
          <div className="field">
            <label className="field-label" htmlFor="veh-num">
              Vehicle number
            </label>
            <input
              id="veh-num"
              className="input mono"
              placeholder="TS 09 AB 5678"
              value={form.vehicleNumber}
              onChange={(e) =>
                setForm({ ...form, vehicleNumber: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="veh-type">
              Vehicle type
            </label>
            <select
              id="veh-type"
              className="select"
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t} {t === 'CAR' ? '· needs MEDIUM bay' : t === 'TWO_WHEELER' ? '· needs SMALL bay' : '· needs LARGE bay'}
                </option>
              ))}
            </select>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor="veh-brand">
                Brand
              </label>
              <input
                id="veh-brand"
                className="input"
                placeholder="Hyundai"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="veh-model">
                Model
              </label>
              <input
                id="veh-model"
                className="input"
                placeholder="Creta"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save} style={{ flex: 1 }}>
              {modal === 'add' ? 'Add vehicle' : 'Save changes'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
