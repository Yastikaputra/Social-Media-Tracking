'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useZoom } from '@/context/ZoomContext';
import { api } from '@/lib/api';
import { User } from '@/types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X,
  AlertTriangle
} from 'lucide-react';

export default function UsersManagementPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading, isAdmin } = useAuth();
  const { isFullWidth } = useZoom();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/brands/medispro');
      }
    }
  }, [currentUser, authLoading, isAdmin, router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      if (err?.status === 401 || err?.message === 'Unauthenticated.' || err?.isAuthError) {
        router.push('/login');
        return;
      }
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && isAdmin) {
      loadUsers();
    }
  }, [currentUser, authLoading, isAdmin]);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('staff');
    setStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setStatus(u.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name,
          email,
          ...(password ? { password } : {}),
          role,
          status,
        });
      } else {
        if (!password) {
          setFormError('Password wajib diisi untuk pengguna baru.');
          setFormLoading(false);
          return;
        }
        await api.createUser({
          name,
          email,
          password,
          role,
          status,
        });
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setFormError(err?.data?.message || err?.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus user ${u.name} (${u.email})?`)) {
      try {
        await api.deleteUser(u.id);
        loadUsers();
      } catch (err: any) {
        alert(err?.data?.message || 'Gagal menghapus user.');
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`${isFullWidth ? 'w-full max-w-[2000px]' : 'max-w-6xl'} mx-auto px-4 sm:px-6 py-6 space-y-6 transition-all duration-300`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Pengguna</h1>
          <p className="text-xs text-zinc-500">
            Kelola akun tim yang dapat mengisi catatan tracking media sosial
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="border border-zinc-200 rounded-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold bg-zinc-50/75">
                <th className="py-2.5 px-4">Nama</th>
                <th className="py-2.5 px-4">Alamat Email</th>
                <th className="py-2.5 px-4">Peran</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-center">Catatan</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-zinc-900 block">{u.name}</span>
                    {u.id === currentUser?.id && (
                      <span className="text-[10px] text-zinc-500">(Akun Anda)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-zinc-600 tabular-nums">{u.email}</td>
                  <td className="py-2.5 px-4">
                    <span className="text-xs font-medium text-zinc-800 uppercase text-[11px]">
                      {u.role === 'admin' ? 'Administrator' : 'Staf PIC'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-block text-[11px] font-medium ${
                      u.status === 'active' ? 'text-zinc-700' : 'text-zinc-400'
                    }`}>
                      {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-zinc-600">
                    {u.tracking_tasks_count || 0}
                  </td>
                  <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                      title="Edit Pengguna"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="font-semibold text-gray-900 text-sm">
                {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rina Marketing"
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Alamat Email (Login) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@kumtura.com"
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Kata Sandi {editingUser ? '(Kosongkan jika tidak diubah)' : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                  {...(!editingUser ? { required: true } : {})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">Role / Peran</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                  >
                    <option value="staff">Staff / PIC</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">Status Akun</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Menyimpan...' : editingUser ? 'Perbarui User' : 'Buat User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
