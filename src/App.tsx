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
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- COMPONENTS ---
const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
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
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>
        
        <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Special Technical Services L.L.C<br/>
          Authorized Personnel Only
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
      let errorMessage = "Something went wrong.";
      try {
        const errorInfo = JSON.parse((this.state.error as any).message);
        errorMessage = `Firestore Error: ${errorInfo.error} during ${errorInfo.operationType} on ${errorInfo.path}`;
      } catch (e) {
        errorMessage = (this.state.error as any).message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-100 max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Application Error</h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
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

// --- DATA ---
const INITIAL_VEHICLE_DATA = [
  {
    srNo: 1,
    fleetCode: 'WR-04',
    makeModel: 'VOLVO 10T ROLLER',
    repairType: 'MJR',
    repairDescription: 'MAJOR REPAIR',
    dateBD: '1-Mar-26',
    dateIn: '',
    repairLocation: 'GHALA',
    branchPlant: 'PLK00013',
    status: 'UP',
    remarks: 'Under progress',
    normalBDDays: 30,
    specialBDDays: 0,
    totalBDDays: 30,
    activeDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]
  },
  {
    srNo: 2,
    fleetCode: 'GR-03',
    makeModel: 'VOLVO GRADER',
    repairType: 'MJR',
    repairDescription: 'CIRCLE CYLINDER HOLDER BROKEN',
    dateBD: '5-Mar-26',
    dateIn: '',
    repairLocation: 'KHAZZAN',
    branchPlant: 'PLK00013',
    status: 'WC',
    remarks: 'Work Completed',
    normalBDDays: 26,
    specialBDDays: 0,
    totalBDDays: 26,
    activeDays: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]
  },
  {
    srNo: 3,
    fleetCode: 'VB-302',
    makeModel: 'BUS 20 STR-TOYOTA COASTER',
    repairType: 'MJR',
    repairDescription: 'MAJOR REPAIR',
    dateBD: '14-Mar-26',
    dateIn: '14-Mar-26',
    repairLocation: 'GHALA',
    branchPlant: 'PLK00013',
    status: 'PA',
    remarks: 'Parts Awaiting',
    normalBDDays: 17,
    specialBDDays: 0,
    totalBDDays: 17,
    activeDays: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]
  },
  {
    srNo: 4,
    fleetCode: 'EC-376PL',
    makeModel: 'AIR COMPRESSOR SCREW-INGERSOLL',
    repairType: 'MIN',
    repairDescription: 'STARTING COMPLAINT',
    dateBD: '16-Mar-26',
    dateIn: '',
    repairLocation: 'KHAZZAN',
    branchPlant: 'PLK00013',
    status: 'AA',
    remarks: 'Approval Awaiting',
    normalBDDays: 15,
    specialBDDays: 0,
    totalBDDays: 15,
    activeDays: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]
  },
  {
    srNo: 5,
    fleetCode: 'VB-353',
    makeModel: 'Ashok Leyland Bus 56seater',
    repairType: 'MJR',
    repairDescription: 'MAJOR REPAIR',
    dateBD: '22-Mar-26',
    dateIn: '22-Mar-26',
    repairLocation: 'GHALA',
    branchPlant: 'PLK00013',
    status: 'DA',
    remarks: 'Delivery Awaiting',
    normalBDDays: 9,
    specialBDDays: 0,
    totalBDDays: 9,
    activeDays: [22, 23, 24, 25, 26, 27, 28]
  },
  {
    srNo: 6,
    fleetCode: 'VT-722',
    makeModel: '3 TON D/C TRUCK HINOXZU6',
    repairType: 'MJR',
    repairDescription: 'MISUSED-PANEL MISSUED',
    dateBD: '29-Mar-26',
    dateIn: '',
    repairLocation: '',
    branchPlant: 'PLK00013',
    status: 'PA',
    remarks: 'WAIT FOR PART',
    normalBDDays: 0,
    specialBDDays: 2,
    totalBDDays: 2,
    activeDays: [29, 30]
  },
  {
    srNo: 7,
    fleetCode: 'VC-310',
    makeModel: 'AMBULANCE LAND CRUISER DLX 9',
    repairType: 'ACC',
    repairDescription: 'WINDSCREEN CRACK',
    dateBD: '29-Mar-26',
    dateIn: '',
    repairLocation: '',
    branchPlant: 'PLK00013',
    status: 'UP',
    remarks: 'Under progress',
    normalBDDays: 0,
    specialBDDays: 2,
    totalBDDays: 2,
    activeDays: [29, 30]
  },
  {
    srNo: 8,
    fleetCode: 'VC-312',
    makeModel: 'STATION WAGON 4X4 PAJERO MITSU',
    repairType: 'MJR',
    repairDescription: 'GEAR MALFUNCTION',
    dateBD: '29-Mar-26',
    dateIn: '',
    repairLocation: '',
    branchPlant: '',
    status: 'UP',
    remarks: 'Under progress',
    normalBDDays: 2,
    specialBDDays: 0,
    totalBDDays: 2,
    activeDays: [29, 30]
  },
  {
    srNo: 9,
    fleetCode: 'VT-794',
    makeModel: 'TRANSIT MIXER 10CBM-UD QUESTER',
    repairType: 'MJR',
    repairDescription: 'ALTERNATOR MALFUNCTION',
    dateBD: '29-Mar-26',
    dateIn: '',
    repairLocation: '',
    branchPlant: '',
    status: 'UP',
    remarks: 'Itemcode creation inprogress',
    normalBDDays: 2,
    specialBDDays: 0,
    totalBDDays: 2,
    activeDays: [29, 30]
  }
];

const COLORS = ['#009E3F', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#8b5cf6', '#f97316'];

const STATUS_REMARKS: Record<string, string> = {
  'UP': 'Under progress',
  'WC': 'Work Completed',
  'PA': 'Parts Awaited',
  'AA': 'Approval Awaited',
  'DA': 'Decision Awaited'
};

// --- COMPONENTS ---

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
  const totalBreakdowns = useMemo(() => vehicleData.reduce((acc, v) => acc + v.totalBDDays, 0), [vehicleData]);
  const activeBDDays = useMemo(() => {
    const days = new Set();
    vehicleData.forEach(v => v.activeDays.forEach((d: number) => days.add(d)));
    return days.size;
  }, [vehicleData]);

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
      summary[bp].normalDays += v.normalBDDays;
      summary[bp].specialDays += v.specialBDDays;
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
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          icon={Truck} 
          label="Total Fleet Reported" 
          value={vehicleData.length} 
          sub="Vehicles with breakdowns"
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
          value={vehicleData.reduce((acc, v) => acc + v.normalBDDays, 0)} 
          sub="Total normal days"
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <KPICard 
          icon={CheckCircle2} 
          label="Special B/D" 
          value={vehicleData.reduce((acc, v) => acc + v.specialBDDays, 0)} 
          sub="Accident/Misused days"
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <KPICard 
          icon={Calendar} 
          label="Active B/D Days" 
          value={activeBDDays} 
          sub="Days with incidents"
          colorClass="text-[#009E3F]"
          bgClass="bg-emerald-50"
        />
      </div>

      {/* Status Tiles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#009E3F]" />
          <h3 className="font-bold text-slate-800">Status Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatusTile 
            status="UP" 
            count={vehicleData.filter(v => v.status === 'UP').length} 
            color="bg-[#FFC107]" 
            textColor="text-black"
          />
          <StatusTile 
            status="PA" 
            count={vehicleData.filter(v => v.status === 'PA').length} 
            color="bg-[#E67E22]" 
            textColor="text-black"
          />
          <StatusTile 
            status="WC" 
            count={vehicleData.filter(v => v.status === 'WC').length} 
            color="bg-[#27AE60]" 
            textColor="text-white"
          />
          <StatusTile 
            status="AA" 
            count={vehicleData.filter(v => v.status === 'AA').length} 
            color="bg-[#D98880]" 
            textColor="text-white"
          />
          <StatusTile 
            status="DA" 
            count={vehicleData.filter(v => v.status === 'DA').length} 
            color="bg-[#FF0000]" 
            textColor="text-white"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#009E3F]" />
            <h3 className="font-bold text-slate-800">Breakdowns by Vehicle</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fleetCode" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="normalBDDays" name="Normal B/D" fill="#009E3F" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="specialBDDays" name="Special B/D" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-[#009E3F]" />
            <h3 className="font-bold text-slate-800">Repair Type Composition</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeComposition}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {typeComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Branch Plant Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Plant Table */}
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
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Normal B/D</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Special B/D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchPlantSummary.map((bp) => (
                  <tr key={bp.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{bp.name}</td>
                    <td className="px-4 py-3 text-sm font-black text-center text-[#009E3F]">{bp.count}</td>
                    <td className="px-4 py-3 text-sm font-bold text-center text-slate-600">{bp.normalDays}</td>
                    <td className="px-4 py-3 text-sm font-bold text-center text-amber-600">{bp.specialDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Plant Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#009E3F]" />
            <h3 className="font-bold text-slate-800">Vehicles by Branch Plant</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchPlantSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} width={80} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Vehicles" fill="#009E3F" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
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
}: { 
  vehicleData: any[], 
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void,
  onExport: (data: any[]) => void,
  onEdit: (vehicle: any) => void,
  onDelete: (vehicle: any) => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const triggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.focus();
      // Use a small delay to ensure focus and layout are stable
      setTimeout(() => {
        window.print();
      }, 250);
    }
  };

  const filteredData = useMemo(() => {
    const filtered = vehicleData.filter(v => {
      const matchesStatus = statusFilter === '' || v.status === statusFilter;
      
      const searchStr = `${v.fleetCode} ${v.makeModel} ${v.repairDescription} ${v.repairLocation} ${v.branchPlant} ${v.remarks}`.toLowerCase();
      const matchesGlobal = globalSearch === '' || searchStr.includes(globalSearch.toLowerCase());

      return matchesStatus && matchesGlobal;
    });

    // Sort: WC at the bottom, others at the top, then by updatedAt desc
    return filtered.sort((a, b) => {
      if (a.status === 'WC' && b.status !== 'WC') return 1;
      if (a.status !== 'WC' && b.status === 'WC') return -1;
      
      const dateA = new Date(a.updatedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [vehicleData, statusFilter, globalSearch]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(vehicleData.map(v => v.status));
    return Array.from(statuses).sort();
  }, [vehicleData]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="px-6 py-5 border-b border-slate-300 flex items-center justify-between bg-slate-50/50 no-print">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-slate-400" />
          <h3 className="font-bold text-slate-800">P&E Breakdown Log Sheet – {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[#009E3F] transition-colors" />
            <input 
              type="text" 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search vehicles..."
              className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs font-medium w-64 focus:ring-2 focus:ring-[#009E3F] focus:bg-white outline-none transition-all"
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onUpload} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-[#009E3F] hover:bg-emerald-100 bg-emerald-50 px-4 py-2 rounded-xl transition-all border border-emerald-100 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Excel
          </button>
          <button 
            onClick={() => onExport(filteredData)}
            className="text-xs font-bold text-[#009E3F] hover:bg-emerald-100 bg-emerald-50 px-4 py-2 rounded-xl transition-all border border-emerald-100 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          <button 
            onClick={() => setIsPrintPreview(true)}
            className="text-xs font-bold text-slate-600 hover:bg-slate-100 bg-white px-4 py-2 rounded-xl transition-all border border-slate-200 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>
      
      {/* Print Preview Modal */}
      <AnimatePresence>
        {isPrintPreview && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-[200] no-print">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Printer className="w-5 h-5 text-[#009E3F]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Print Preview</h3>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Review your report before printing · <span className="text-emerald-600 font-bold">Tip: Press Ctrl+P if the button fails</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      triggerPrint();
                    }}
                    className="bg-[#009E3F] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 cursor-pointer relative z-[200] pointer-events-auto"
                  >
                    <Printer className="w-4 h-4" />
                    Print Now
                  </button>
                  <button 
                    onClick={() => setIsPrintPreview(false)}
                    className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-8 bg-slate-50/50 print:p-0 print:bg-white">
                <div 
                  ref={printRef} 
                  className="bg-white p-8 shadow-sm mx-auto w-full print:shadow-none print:p-0 print:m-0 print:w-full print-only"
                >
                  {/* Print Header */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between border-b-2 border-[#009E3F] pb-6">
                      <div className="flex items-center gap-8">
                        <div className="text-6xl font-logo select-none leading-none" style={{
                          color: 'white',
                          WebkitTextStroke: '2px #00B050',
                          textShadow: `
                            -1px 1px 0px #00B050,
                            -2px 2px 0px #00B050,
                            -3px 3px 0px #00B050
                          `,
                          letterSpacing: '0.1em'
                        }}>
                          STS
                        </div>
                        <div>
                          <h1 className="text-3xl font-black text-slate-900 leading-tight">P&E Breakdown Summary Report</h1>
                          <p className="text-base font-bold text-[#00B050]">Special Technical Services L.L.C · <span className="text-slate-500 text-sm">Plant Division</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report Date</p>
                        <p className="text-xl font-black text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
                      </div>
                    </div>
                    {globalSearch && (
                      <div className="mt-6 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-fit">
                        <Search className="w-4 h-4" />
                        <span className="font-medium">Filtered by:</span>
                        <span className="font-bold text-slate-900">"{globalSearch}"</span>
                      </div>
                    )}
                  </div>

                  {/* Table */}
                  <div className="w-full overflow-hidden">
                    <table className="w-full text-left border-collapse table-fixed border border-slate-200">
                      <thead>
                        <tr className="bg-[#009E3F] text-white">
                          <th rowSpan={2} style={{ width: '3%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 text-center">SR NO</th>
                          <th rowSpan={2} style={{ width: '6%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 whitespace-nowrap">FLEET NO.</th>
                          <th rowSpan={2} style={{ width: '10%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 whitespace-nowrap">MAKE/ MODEL</th>
                          <th style={{ width: '7%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 text-center">REPAIR TYPE</th>
                          <th rowSpan={2} style={{ width: '14%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 whitespace-nowrap">REPAIR DESCRIPTION</th>
                          <th rowSpan={2} style={{ width: '7%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 text-center whitespace-nowrap">DATE B/D</th>
                          <th style={{ width: '7%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 text-center">DATE IN</th>
                          <th rowSpan={2} style={{ width: '8%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 whitespace-nowrap">REPAIR LOCATION</th>
                          <th rowSpan={2} style={{ width: '8%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 whitespace-nowrap">BRANCH PLANT</th>
                          <th rowSpan={2} style={{ width: '5%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 text-center">STATUS</th>
                          <th rowSpan={2} style={{ width: '10%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 whitespace-nowrap">REMARKS</th>
                          <th rowSpan={2} style={{ width: '5%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 text-center leading-tight">NORMAL B/D DAYS</th>
                          <th rowSpan={2} style={{ width: '5%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 text-center leading-tight">SPECIAL B/D DAYS</th>
                          <th rowSpan={2} style={{ width: '5%' }} className="px-1 py-1 text-[7px] font-black uppercase border border-white/20 text-center leading-tight">TOTAL B/D DAYS</th>
                        </tr>
                        <tr className="bg-[#009E3F] text-white">
                          <th className="px-1 py-0.5 text-[7px] font-black uppercase border border-white/20 text-center whitespace-nowrap">MIN/MJR/ACC</th>
                          <th className="px-1 py-0.5 text-[7px] font-black uppercase border border-white/20 text-center whitespace-nowrap">GHALA W/S</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredData.map((vehicle, index) => (
                          <tr key={vehicle.fleetCode} className="border-b border-slate-200">
                            <td className="px-1 py-0.5 text-[7px] text-center border-r border-slate-200 font-bold text-slate-600">{index + 1}</td>
                            <td className="px-1 py-0.5 border-r border-slate-200 whitespace-nowrap font-bold text-slate-900 text-[7px]">{vehicle.fleetCode}</td>
                            <td className="px-1 py-0.5 text-[7px] font-bold text-slate-900 border-r border-slate-200 uppercase">{vehicle.makeModel}</td>
                            <td className="px-1 py-0.5 text-[7px] text-center font-bold border-r border-slate-200 text-slate-900">{vehicle.repairType}</td>
                            <td className="px-1 py-0.5 text-[7px] text-slate-900 font-bold border-r border-slate-200 uppercase">{vehicle.repairDescription}</td>
                            <td className="px-1 py-0.5 text-[7px] text-center text-slate-900 font-bold border-r border-slate-200 whitespace-nowrap">{vehicle.dateBD}</td>
                            <td className="px-1 py-0.5 text-[7px] text-center text-slate-900 font-bold border-r border-slate-200 whitespace-nowrap">{vehicle.dateIn || '-'}</td>
                            <td className="px-1 py-0.5 text-[7px] text-slate-900 font-bold border-r border-slate-200 uppercase">{vehicle.repairLocation || '-'}</td>
                            <td className="px-1 py-0.5 text-[7px] text-slate-900 font-bold border-r border-slate-200 uppercase">{vehicle.branchPlant || '-'}</td>
                            <td className="px-1 py-0.5 text-[7px] text-center font-bold border-r border-slate-200">
                              <span className={cn(
                                "inline-block w-8 py-0.5 rounded-[2px] text-[7px] font-black",
                                vehicle.status === 'UP' && "bg-[#FFC107] text-black",
                                vehicle.status === 'WC' && "bg-[#27AE60] text-white",
                                vehicle.status === 'PA' && "bg-[#E67E22] text-black",
                                vehicle.status === 'AA' && "bg-[#D98880] text-white",
                                vehicle.status === 'DA' && "bg-[#FF0000] text-white"
                              )}>
                                {vehicle.status}
                              </span>
                            </td>
                            <td className="px-1 py-0.5 text-[7px] text-slate-600 border-r border-slate-200 italic font-medium">{vehicle.remarks}</td>
                            <td className="px-1 py-0.5 text-[7px] text-center font-black border-r border-slate-200 text-slate-900">{vehicle.normalBDDays || ''}</td>
                            <td className="px-1 py-0.5 text-[7px] text-center font-black border-r border-slate-200 text-slate-900">{vehicle.specialBDDays || ''}</td>
                            <td className="px-1 py-0.5 text-[7px] text-center font-black text-slate-900 bg-slate-50/50">{vehicle.totalBDDays}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span className="text-[#00B050]">Special Technical Services L.L.C</span> · Plant Division · Breakdown Summary Report
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto w-full print:hidden no-print">
        <table className="w-full text-left border-collapse min-w-[1800px] print:min-w-0 print:table-fixed">
          <thead>
            <tr className="bg-[#009E3F] text-white border-b border-white/20">
              <th rowSpan={2} className="px-2 py-3 text-[10px] font-black uppercase border-r border-white/20 text-center w-12">SR NO</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 whitespace-nowrap">FLEET NO.</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 whitespace-nowrap">MAKE/ MODEL</th>
              <th className="px-3 py-2 text-[10px] font-black uppercase border-b border-r border-white/20 text-center">REPAIR TYPE</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 whitespace-nowrap">REPAIR DESCRIPTION</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 text-center whitespace-nowrap">DATE B/D</th>
              <th className="px-3 py-2 text-[10px] font-black uppercase border-b border-r border-white/20 text-center">DATE IN</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 whitespace-nowrap">REPAIR LOCATION</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 whitespace-nowrap">BRANCH PLANT</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 text-center">
                <div className="flex flex-col gap-1">
                  <span>STATUS</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-1 py-1 text-[9px] text-slate-800 rounded border-none outline-none font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">All</option>
                    {uniqueStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 whitespace-nowrap">REMARKS</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 text-center w-24 leading-tight">NORMAL BREAKDOWN DAYS</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 text-center w-72 leading-tight">
                <span className="text-white/90">TRANSPORT</span>, <span className="text-white/90">ACCIDENT</span>, <br/>
                <span className="text-white/90">MISUSED</span>, <span className="text-white/90">SPECIAL REQUIREMENT</span> <br/>
                & <span className="text-white font-black underline decoration-white/50">WARRANTY REPAIR</span>
              </th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase border-r border-white/20 text-center w-24 leading-tight">TOTAL BREAKDOWN DAYS</th>
              <th rowSpan={2} className="px-3 py-3 text-[10px] font-black uppercase text-center w-24 print:hidden">ACTIONS</th>
            </tr>
            <tr className="bg-[#009E3F] text-white border-b border-white/20">
              <th className="px-3 py-2 text-[9px] font-black uppercase border-r border-white/20 text-center whitespace-nowrap">MIN / MJR / ACCIDENT</th>
              <th className="px-3 py-2 text-[9px] font-black uppercase border-r border-white/20 text-center whitespace-nowrap">GHALA W/S</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {filteredData.map((vehicle, index) => (
              <tr key={vehicle.fleetCode} className={cn(
                "hover:bg-slate-50/80 transition-colors group",
                vehicle.repairType === 'ACC' ? "bg-rose-50/60" : ""
              )}>
                <td className="px-2 py-3 text-[11px] text-center border-r border-slate-300 font-bold text-slate-600">{index + 1}</td>
                <td className="px-3 py-3 border-r border-slate-300 whitespace-nowrap">
                  <span className="font-bold text-slate-900 text-[11px]">{vehicle.fleetCode}</span>
                </td>
                <td className="px-3 py-3 text-[11px] font-bold text-slate-900 border-r border-slate-300 whitespace-nowrap uppercase">{vehicle.makeModel}</td>
                <td className="px-3 py-3 text-[11px] text-center font-bold border-r border-slate-300 text-slate-900">{vehicle.repairType}</td>
                <td className="px-3 py-3 text-[11px] text-slate-900 font-bold border-r border-slate-300 whitespace-nowrap uppercase">{vehicle.repairDescription}</td>
                <td className="px-3 py-3 text-[11px] text-center text-slate-900 font-bold border-r border-slate-300 whitespace-nowrap">{vehicle.dateBD}</td>
                <td className="px-3 py-3 text-[11px] text-center text-slate-900 font-bold border-r border-slate-300 whitespace-nowrap">{vehicle.dateIn || '-'}</td>
                <td className="px-3 py-3 text-[11px] text-slate-900 font-bold border-r border-slate-300 whitespace-nowrap uppercase">{vehicle.repairLocation || '-'}</td>
                <td className="px-3 py-3 text-[11px] text-slate-900 font-bold border-r border-slate-300 whitespace-nowrap uppercase">{vehicle.branchPlant || '-'}</td>
                <td className="px-3 py-3 text-[11px] text-center font-bold border-r border-slate-300">
                  <span className={cn(
                    "inline-block w-10 py-1 rounded text-[10px] font-black shadow-sm",
                    vehicle.status === 'UP' && "bg-[#FFC107] text-black",
                    vehicle.status === 'WC' && "bg-[#27AE60] text-white",
                    vehicle.status === 'PA' && "bg-[#E67E22] text-black",
                    vehicle.status === 'AA' && "bg-[#D98880] text-white",
                    vehicle.status === 'DA' && "bg-[#FF0000] text-white",
                    !['UP', 'WC', 'PA', 'AA', 'DA'].includes(vehicle.status) && "bg-slate-100 text-slate-600"
                  )}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-[11px] text-slate-600 border-r border-slate-300 whitespace-nowrap italic font-medium">{vehicle.remarks}</td>
                <td className="px-3 py-3 text-[11px] text-center font-black border-r border-slate-300 text-slate-900">{vehicle.normalBDDays || ''}</td>
                <td className="px-3 py-3 text-[11px] text-center font-black border-r border-slate-300 text-slate-900">{vehicle.specialBDDays || ''}</td>
                <td className="px-3 py-3 text-[11px] text-center font-black border-r border-slate-300 text-slate-900 bg-slate-50/50">{vehicle.totalBDDays}</td>
                <td className="px-3 py-3 text-[11px] text-center whitespace-nowrap print:hidden">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(vehicle)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(vehicle)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

const NavLink = ({ to, icon: Icon, children }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
        isActive 
          ? "bg-[#009E3F] text-white shadow-lg shadow-emerald-100" 
          : "text-slate-500 hover:bg-slate-100"
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  );
};

const App = () => {
  const [vehicleData, setVehicleData] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<any | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  // Update form remarks when editing starts
  useEffect(() => {
    if (editingVehicle) {
      setFormRemarks(editingVehicle.remarks || '');
    }
  }, [editingVehicle]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const path = 'vehicles';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setVehicleData(data);
      setIsInitialized(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const handleSaveVehicle = async (formData: any) => {
    if (!user) return;
    const path = `vehicles/${formData.fleetCode}`;
    try {
      const updatedEntry = {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email || user.uid
      };
      await setDoc(doc(db, 'vehicles', formData.fleetCode), updatedEntry);
      setEditingVehicle(null);
      setUploadStatus({ type: 'success', message: 'Vehicle updated successfully.' });
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteVehicle = async (fleetCode: string) => {
    if (!user) return;
    const path = `vehicles/${fleetCode}`;
    try {
      await deleteDoc(doc(db, 'vehicles', fleetCode));
      setDeletingVehicle(null);
      setUploadStatus({ type: 'success', message: 'Vehicle deleted successfully.' });
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rawData.length === 0) {
          setUploadStatus({ type: 'error', message: 'No data found in the uploaded file.' });
          return;
        }

        const processedData = rawData.map((row: any, index: number) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toString().trim().toUpperCase().replace(/\s+/g, ' ');
            normalizedRow[normalizedKey] = row[key];
          });

          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const normalizedKey = key.toUpperCase().replace(/\s+/g, ' ');
              if (normalizedRow[normalizedKey] !== undefined && normalizedRow[normalizedKey] !== null && normalizedRow[normalizedKey] !== "") {
                return normalizedRow[normalizedKey];
              }
            }
            return "";
          };

          const formatDate = (val: any) => {
            if (!val) return "";
            if (val instanceof Date) {
              return val.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
            }
            if (typeof val === 'number' && val > 40000) {
              const date = new Date((val - 25569) * 86400 * 1000);
              return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-');
            }
            return val.toString();
          };

          const fleetCode = (getVal(['FLEET NO.', 'FLEET NO', 'FLEETCODE', 'FLEET CODE', 'VEHICLE NO', 'VEHICLE NO.', 'FLEET_CODE', 'FLEET', 'CODE']) || `V-${index}`).toString().trim();
          const status = (getVal(['STATUS', 'VEHICLE STATUS', 'VEHICLE_STATUS']) || "UP").toString().toUpperCase().trim();
          const normalDays = Number(getVal(['NORMAL BREAKDOWN DAYS', 'NORMAL B/D DAYS', 'NORMAL DAYS', 'NORMAL_DAYS']) || 0);
          const specialDays = Number(getVal(['TRANSPORT, ACCIDENT, MISUSED, SPECIAL REQUIREMENT & WARRANTY REPAIR', 'SPECIAL BREAKDOWN DAYS', 'SPECIAL B/D DAYS', 'SPECIAL DAYS', 'SPECIAL_DAYS']) || 0);

          return {
            srNo: index + 1,
            fleetCode,
            makeModel: (getVal(['MAKE/ MODEL', 'MAKE MODEL', 'MAKEMODEL', 'MODEL', 'VEHICLE MODEL']) || "").toString(),
            repairType: (getVal(['REPAIR TYPE', 'REPAIRTYPE', 'TYPE', 'REPAIR_TYPE', 'MIN / MJR / ACCIDENT']) || "MJR").toString(),
            repairDescription: (getVal(['REPAIR DESCRIPTION', 'REPAIRDESCRIPTION', 'DESCRIPTION', 'REPAIR_DESC']) || "").toString(),
            dateBD: formatDate(getVal(['DATE B/D', 'DATE BD', 'DATEBD', 'BD DATE', 'BREAKDOWN DATE', 'B/D DATE'])) || "",
            dateIn: formatDate(getVal(['DATE IN', 'DATEIN', 'IN DATE', 'DATE_IN', 'GHALA W/S'])) || "",
            repairLocation: (getVal(['REPAIR LOCATION', 'REPAIRLOCATION', 'LOCATION', 'SITE']) || "").toString(),
            branchPlant: (getVal(['BRANCH PLANT', 'BRANCHPLANT', 'PLANT', 'BRANCH']) || "").toString(),
            status,
            remarks: (getVal(['REMARKS', 'REMARK', 'COMMENT']) || STATUS_REMARKS[status] || "").toString(),
            normalBDDays: normalDays,
            specialBDDays: specialDays,
            totalBDDays: normalDays + specialDays,
            activeDays: [],
            updatedAt: new Date().toISOString(),
            updatedBy: user.email || user.uid
          };
        }).filter(item => item.fleetCode && !item.fleetCode.startsWith('V-')); // Filter out rows without fleet code if possible

        // Batch upload
        for (const item of processedData) {
          await setDoc(doc(db, 'vehicles', item.fleetCode), item);
        }

        setUploadStatus({ type: 'success', message: `Successfully uploaded ${processedData.length} records.` });
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
        e.target.value = '';
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadStatus({ type: 'error', message: 'Failed to process Excel file. Please check the format.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#009E3F] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleExport = (dataToExport: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map((v, index) => ({
      'SR NO': index + 1,
      'FLEET NO.': v.fleetCode,
      'MAKE/ MODEL': v.makeModel,
      'REPAIR TYPE': v.repairType,
      'REPAIR DESCRIPTION': v.repairDescription,
      'DATE B/D': v.dateBD,
      'DATE IN': v.dateIn,
      'REPAIR LOCATION': v.repairLocation,
      'BRANCH PLANT': v.branchPlant,
      'STATUS': v.status,
      'REMARKS': v.remarks,
      'NORMAL B/D DAYS': v.normalBDDays,
      'SPECIAL B/D DAYS': v.specialBDDays,
      'TOTAL B/D DAYS': v.totalBDDays
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Breakdown Log");
    const fileName = `Breakdown_Log_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 no-print">
          <div className="flex items-center gap-1">
            <div className="flex items-center justify-center text-6xl select-none leading-none font-logo" style={{
              color: 'white',
              WebkitTextStroke: '2px #00B050',
              textShadow: `
                -1px 1px 0px #00B050,
                -2px 2px 0px #00B050,
                -3px 3px 0px #00B050,
                -4px 4px 0px #00B050,
                -5px 5px 0px #00B050
              `,
              letterSpacing: '0.2em'
            }}>
              STS
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900">P&E Breakdown Summary</h1>
              <p className="text-[10px] font-medium">
                <span className="text-[#00B050]">Special Technical Services L.L.C</span> · <span className="text-slate-500">Plant Division</span>
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
            <NavLink to="/logs" icon={FileText}>Log Sheet</NavLink>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-[#009E3F] px-4 py-2 rounded-full text-[10px] font-bold ring-1 ring-emerald-100">
              <div className="w-1.5 h-1.5 bg-[#009E3F] rounded-full animate-pulse" />
              {new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase()}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none mb-1">{user?.displayName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user?.email}</p>
              </div>
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" alt="User" />
              ) : (
                <div className="w-10 h-10 bg-[#009E3F] rounded-xl flex items-center justify-center text-white font-black">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </div>
              )}
              <button 
                onClick={() => signOut(auth)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                title="Sign Out"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Upload Status Notification */}
          <AnimatePresence>
            {uploadStatus.type && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "mb-6 p-4 rounded-xl border flex items-center gap-3 shadow-sm",
                  uploadStatus.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                )}
              >
                {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <p className="text-sm font-bold">{uploadStatus.message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard vehicleData={vehicleData} />} />
              <Route path="/logs" element={<LogSheet vehicleData={vehicleData} onUpload={handleFileUpload} onExport={handleExport} onEdit={setEditingVehicle} onDelete={setDeletingVehicle} />} />
            </Routes>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {editingVehicle && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800">Edit Vehicle: {editingVehicle.fleetCode}</h3>
                  <button onClick={() => setEditingVehicle(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const updated = {
                      ...editingVehicle,
                      makeModel: formData.get('makeModel'),
                      repairType: formData.get('repairType'),
                      repairDescription: formData.get('repairDescription'),
                      dateBD: formData.get('dateBD'),
                      dateIn: formData.get('dateIn'),
                      repairLocation: formData.get('repairLocation'),
                      branchPlant: formData.get('branchPlant'),
                      status: formData.get('status'),
                      remarks: formData.get('remarks'),
                      normalBDDays: Number(formData.get('normalBDDays')),
                      specialBDDays: Number(formData.get('specialBDDays')),
                      totalBDDays: Number(formData.get('normalBDDays')) + Number(formData.get('specialBDDays'))
                    };
                    handleSaveVehicle(updated);
                  }}
                  className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Make / Model</label>
                    <input name="makeModel" defaultValue={editingVehicle.makeModel} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Repair Type</label>
                    <select name="repairType" defaultValue={editingVehicle.repairType} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none">
                      <option value="MIN">MIN</option>
                      <option value="MJR">MJR</option>
                      <option value="ACC">ACC</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Repair Description</label>
                    <input name="repairDescription" defaultValue={editingVehicle.repairDescription} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date B/D</label>
                    <input name="dateBD" defaultValue={editingVehicle.dateBD} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date In</label>
                    <input name="dateIn" defaultValue={editingVehicle.dateIn} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Repair Location</label>
                    <input name="repairLocation" defaultValue={editingVehicle.repairLocation} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Branch Plant</label>
                    <input name="branchPlant" defaultValue={editingVehicle.branchPlant} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                    <select 
                      name="status" 
                      defaultValue={editingVehicle.status} 
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        if (STATUS_REMARKS[newStatus]) {
                          setFormRemarks(STATUS_REMARKS[newStatus]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none"
                    >
                      <option value="UP">UP</option>
                      <option value="WC">WC</option>
                      <option value="PA">PA</option>
                      <option value="AA">AA</option>
                      <option value="DA">DA</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Remarks</label>
                    <input 
                      name="remarks" 
                      value={formRemarks} 
                      onChange={(e) => setFormRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Normal B/D Days</label>
                    <input type="number" name="normalBDDays" defaultValue={editingVehicle.normalBDDays} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Special B/D Days</label>
                    <input type="number" name="specialBDDays" defaultValue={editingVehicle.specialBDDays} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#009E3F] outline-none" />
                  </div>
                  <div className="sm:col-span-2 pt-4 flex gap-3">
                    <button type="submit" className="flex-1 bg-[#009E3F] text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                      Save Changes
                    </button>
                    <button type="button" onClick={() => setEditingVehicle(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deletingVehicle && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Delete</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Are you sure you want to delete vehicle <span className="font-bold text-slate-900">{deletingVehicle.fleetCode}</span>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDeleteVehicle(deletingVehicle.fleetCode)}
                      className="flex-1 bg-rose-600 text-white font-bold py-2.5 rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => setDeletingVehicle(null)}
                      className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="w-full px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 text-center no-print">
          <p className="text-[10px] font-bold uppercase tracking-widest">
            <span className="text-[#00B050]">Special Technical Services L.L.C</span> · <span className="text-slate-400">Plant Division · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </p>
          <p className="text-[9px] text-slate-300 mt-2">
            Generated from Breakdown Summary of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </footer>
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
