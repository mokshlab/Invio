import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);

  const [form, setForm] = useState({
    name: '',
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    taxId: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileService.get();
        const u = data.user;
        setForm({
          name: u.name || '',
          businessName: u.businessName || '',
          businessEmail: u.businessEmail || '',
          businessPhone: u.businessPhone || '',
          businessAddress: u.businessAddress || '',
          taxId: u.taxId || '',
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePassChange = (e) =>
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');

    setSaving(true);
    try {
      const { data } = await profileService.update(form);
      setUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setChangingPass(true);
    try {
      await profileService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const passwordStrength = (p) => {
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];

  if (loading) return <LoadingSpinner />;

  const strength = passwordStrength(passwords.newPassword);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account and business information
        </p>
      </div>

      {/* Personal Info */}
      <form onSubmit={handleProfileSave}>
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 rounded-lg">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Personal Info</h2>
              <p className="text-sm text-gray-500">Your name and email</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="input-field bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="card mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
              <p className="text-sm text-gray-500">
                This info will appear on your invoices
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                className="input-field"
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Business Email
              </label>
              <input
                type="email"
                name="businessEmail"
                value={form.businessEmail}
                onChange={handleChange}
                className="input-field"
                placeholder="billing@acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Business Phone
              </label>
              <input
                type="text"
                name="businessPhone"
                value={form.businessPhone}
                onChange={handleChange}
                className="input-field"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax / GST ID
              </label>
              <input
                type="text"
                name="taxId"
                value={form.taxId}
                onChange={handleChange}
                className="input-field"
                placeholder="GSTIN / Tax ID"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Business Address
              </label>
              <textarea
                name="businessAddress"
                value={form.businessAddress}
                onChange={handleChange}
                className="input-field resize-none"
                rows={3}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password Change */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <KeyRound className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-500">Change your password</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPassSection(!showPassSection)}
            className="btn-secondary text-sm"
          >
            {showPassSection ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPassSection && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPass.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePassChange}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => ({ ...p, current: !p.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPass.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePassChange}
                  className="input-field pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwords.newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= strength ? strengthColors[strength] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPass.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePassChange}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwords.confirmPassword &&
                passwords.newPassword !== passwords.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={changingPass}
                className="btn-primary flex items-center gap-2"
              >
                {changingPass ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                {changingPass ? 'Changing...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
