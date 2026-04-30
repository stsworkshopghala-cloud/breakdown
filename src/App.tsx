/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, ChangeEvent, useEffect, Component } from 'react';
import * as XLSX from 'xlsx';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { 
  Truck, 
  Wrench, 
  Settings, 
  CheckCircle2, 
  Calendar, 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  ClipboardList,
  AlertTriangle,
  MapPin,
  Building2,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Upload,
  Download,
  Edit2,
  Trash2,
  X,
  Search,
  Printer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';


// --- COMPONENTS ---
const Login = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/google/url')
      .then(res => res.json())
      .then(data => setAuthUrl(data.url));

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        onLoginSuccess();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess]);

  const handleLogin = () => {
    if (authUrl) {
      window.open(authUrl, 'google_oauth', 'width=600,height=700');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-[#009E3F] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
          <Truck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">STS Plant Division</h1>
        <p className="text-slate-500 mb-10 font-medium">Breakdown Summary Management System</p>
        
        <button 
          onClick={handleLogin}
          disabled={!authUrl}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Connect Google Drive
        </button>
        
        <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Special Technical Services L.L.C<br/>
          Authorized Personnel Only · Storage in Your Drive
        </p>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-100 max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Application Error</h2>
            <p className="text-slate-600 mb-6">{(this.state.error as any)?.message || "Something went wrong."}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#009E3F] text-white font-bold py-3 rounded-xl hover:bg-[#008a37] transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// --- CONSTANTS ---
const COLORS = ['#009E3F', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#8b5cf6', '#f97316'];

const STATUS_REMARKS: Record<string, string> = {
  'UP': 'Under progress',
  'WC': 'Work Completed',
  'PA': 'Parts Awaited',
  'AA': 'Approval Awaited',
  'DA': 'Decision Awaited'
};

// --- SUB-COMPONENTS ---
const KPICard = ({ icon: Icon, label, value, sub, colorClass, bgClass }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
  >
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bgClass)}>
      <Icon className={cn("w-5 h-5", colorClass)} />
    </div>
    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</p>
    <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{value}</h3>
    <p className="text-xs text-slate-400 mt-1">{sub}</p>
  </motion.div>
);

const StatusTile = ({ status, count, color, textColor = 'text-white' }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn("rounded-xl p-3 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all border border-black/5", color)}
  >
    <span className={cn("text-lg font-black", textColor)}>{status}</span>
    <span className={cn("text-2xl font-black", textColor)}>{count}</span>
    <span className={cn("text-[8px] uppercase tracking-widest mt-1 font-bold opacity-80 text-center leading-tight", textColor)}>
      {STATUS_REMARKS[status as keyof typeof STATUS_REMARKS] || 'VEHICLES'}
    </span>
  </motion.div>
);

const Dashboard = ({ vehicleData }: { vehicleData: any[] }) => {
  const totalBreakdowns = useMemo(() => vehicleData.reduce((acc, v) => acc + (v.totalBDDays || 0), 0), [vehicleData]);
  const typeComposition = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicleData.forEach(v => {
      counts[v.repairType] = (counts[v.repairType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vehicleData]);

  const branchPlantSummary = useMemo(() => {
    const summary: Record<string, { count: number, normalDays: number, specialDays: number }> = {};
    vehicleData.forEach(v => {
      const bp = v.branchPlant || 'Unknown';
      if (!summary[bp]) {
        summary[bp] = { count: 0, normalDays: 0, specialDays: 0 };
      }
      summary[bp].count += 1;
      summary[bp].normalDays += (v.normalBDDays || 0);
      summary[bp].specialDays += (v.specialBDDays || 0);
    });
    return Object.entries(summary).map(([name, data]) => ({ name, ...data }));
  }, [vehicleData]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-8 max-w-7xl mx-auto no-print"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          icon={Truck} 
          label="Total Fleet" 
          value={vehicleData.length} 
          sub="Reported breakdowns"
          colorClass="text-[#009E3F]"
          bgClass="bg-emerald-50"
        />
        <KPICard 
          icon={Wrench} 
          label="Total B/D Days" 
          value={totalBreakdowns} 
          sub="Across all fleet"
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <KPICard 
          icon={Settings} 
          label="Normal B/D" 
          value={vehicleData.reduce((acc, v) => acc + (v.normalBDDays || 0), 0)} 
          sub="Total normal days"
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <KPICard 
          icon={CheckCircle2} 
          label="Special B/D" 
          value={vehicleData.reduce((acc, v) => acc + (v.specialBDDays || 0), 0)} 
          sub="Accident/Misused"
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['UP', 'PA', 'WC', 'AA', 'DA'].map((s, idx) => (
          <StatusTile 
            key={s}
            status={s} 
            count={vehicleData.filter(v => v.status === s).length} 
            color={idx % 2 === 0 ? "bg-[#FFC107]" : "bg-[#27AE60]"} 
            textColor={idx % 2 === 0 ? "text-black" : "text-white"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-[#009E3F]" />
            <h3 className="font-bold text-slate-800">Branch Plant Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Branch Plant</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Vehicles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchPlantSummary.map((bp) => (
                  <tr key={bp.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{bp.name}</td>
                    <td className="px-4 py-3 text-sm font-black text-center text-[#009E3F]">{bp.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-[#009E3F]" />
            <h3 className="font-bold text-slate-800">Repair Type</h3>
          </div>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeComposition}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LogSheet = ({ 
  vehicleData, 
  onUpload, 
  onExport,
  onEdit,
  onDelete
}: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const filteredData = useMemo(() => {
    const filtered = vehicleData.filter((v: any) => {
      const searchStr = `${v.fleetCode} ${v.makeModel} ${v.branchPlant}`.toLowerCase();
      return globalSearch === '' || searchStr.includes(globalSearch.toLowerCase());
    });
    return filtered.sort((a: any, b: any) => {
      if (a.status === 'WC' && b.status !== 'WC') return 1;
      if (a.status !== 'WC' && b.status === 'WC') return -1;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }, [vehicleData, globalSearch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#009E3F]"
          />
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={onUpload} accept=".xlsx, .xls" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-[#009E3F] rounded-xl text-sm font-bold border border-emerald-100">
            <Upload className="w-4 h-4" /> Upload
          </button>
          <button onClick={() => onExport(filteredData)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-[#009E3F] rounded-xl text-sm font-bold border border-emerald-100">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#009E3F] text-white">
                <th className="px-4 py-3 text-[10px] font-black uppercase text-center w-12">SR</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase">Fleet No</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase">Model</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-center">Status</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase">Branch</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((v: any, idx: number) => (
                <tr key={v.fleetCode} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-black text-slate-900">{v.fleetCode}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-600">{v.makeModel}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("px-2 py-1 rounded text-[10px] font-black", v.status === 'WC' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-500">{v.branchPlant}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onEdit(v)} className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-slate-400 hover:text-[#009E3F]"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(v.fleetCode)} className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [vehicleData, setVehicleData] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<any>(null);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicleData(data);
      }
    } catch (error) {
      console.error("Fetch vehicles error", error);
    }
  };

  const checkUser = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user) {
          fetchVehicles();
        }
      }
    } catch (error) {
      console.error("Check user error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
    const interval = setInterval(() => {
        if (user) fetchVehicles();
    }, 30000); // Polling every 30s for live data
    return () => clearInterval(interval);
  }, [user]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        for (const row of data) {
           // Basic mapping
           const vehicle = {
             fleetCode: row['FLEET NO'] || row['FLEET NO.'] || 'UNKNOWN',
             makeModel: row['MAKE MODEL'] || row['MAKE/ MODEL'] || '',
             repairType: row['REPAIR TYPE'] || 'MIN',
             repairDescription: row['REPAIR DESCRIPTION'] || '',
             dateBD: row['DATE BD'] || '',
             dateIn: row['DATE IN'] || '',
             repairLocation: row['REPAIR LOCATION'] || '',
             branchPlant: row['BRANCH PLANT'] || '',
             status: row['STATUS'] || 'UP',
             remarks: row['REMARKS'] || '',
             normalBDDays: row['NORMAL BD DAYS'] || 0,
             specialBDDays: row['SPECIAL BD DAYS'] || 0,
             totalBDDays: (row['NORMAL BD DAYS'] || 0) + (row['SPECIAL BD DAYS'] || 0),
           };
           
           await fetch('/api/vehicles', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(vehicle)
           });
        }
        fetchVehicles();
        setUploadStatus({ type: 'success', message: 'Excel data synced to Google Sheet' });
      } catch (error) {
        setUploadStatus({ type: 'error', message: 'Failed to process Excel' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveVehicle = async (v: any) => {
     await fetch('/api/vehicles', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(v)
     });
     setEditingVehicle(null);
     fetchVehicles();
  };

  const handleDeleteVehicle = async (fleetCode: string) => {
    if (window.confirm("Delete record?")) {
      await fetch(`/api/vehicles/${fleetCode}`, { method: 'DELETE' });
      fetchVehicles();
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-[#009E3F] border-t-transparent rounded-full" /></div>;

  if (!user) return <ErrorBoundary><Login onLoginSuccess={checkUser} /></ErrorBoundary>;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 no-print">
          <div className="flex items-center gap-4">
            <Truck className="w-8 h-8 text-[#009E3F]" />
            <div>
              <h1 className="text-lg font-black text-slate-900">STS Breakdown Registry</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Safe Storage in Google Drive</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
             <Link to="/" className="px-4 py-2 text-xs font-bold rounded-xl hover:bg-white transition-all text-slate-600">Dashboard</Link>
             <Link to="/logs" className="px-4 py-2 text-xs font-bold rounded-xl hover:bg-white transition-all text-slate-600">Log Sheet</Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{user.email}</p>
            </div>
            {user.picture ? (
              <img src={user.picture} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
            ) : (
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">{user.email[0]}</div>
            )}
            <button onClick={handleLogout} className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-slate-400 hover:text-rose-500">
               <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
           <Routes>
              <Route path="/" element={<Dashboard vehicleData={vehicleData} />} />
              <Route path="/logs" element={<LogSheet vehicleData={vehicleData} onUpload={handleFileUpload} onEdit={setEditingVehicle} onDelete={handleDeleteVehicle} onExport={() => {}} />} />
           </Routes>
        </main>

        <AnimatePresence>
          {editingVehicle && (
             <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl p-8 max-w-lg w-full">
                  <h3 className="text-xl font-black mb-6">Edit {editingVehicle.fleetCode}</h3>
                  <div className="space-y-4">
                     <input className="w-full p-3 border rounded-xl" defaultValue={editingVehicle.makeModel} onChange={(e) => editingVehicle.makeModel = e.target.value} placeholder="Model" />
                     <select className="w-full p-3 border rounded-xl" defaultValue={editingVehicle.status} onChange={(e) => editingVehicle.status = e.target.value}>
                        <option value="UP">UP</option>
                        <option value="WC">WC</option>
                        <option value="PA">PA</option>
                     </select>
                  </div>
                  <div className="mt-8 flex gap-3">
                     <button onClick={() => handleSaveVehicle(editingVehicle)} className="flex-1 bg-[#009E3F] text-white py-3 rounded-xl font-bold">Save Changes</button>
                     <button onClick={() => setEditingVehicle(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Cancel</button>
                  </div>
               </div>
             </div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
};

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
