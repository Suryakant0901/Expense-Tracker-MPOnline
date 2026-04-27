import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Wallet, Target, Plus, LogOut, 
  Search, Filter, Edit2, Trash2, PieChart as PieIcon, 
  BarChart3, Calendar, ChevronRight, MoreVertical, Users, Sun, Moon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

const CATEGORIES = [
  'Salary', 'Freelance', 'Investments', 'Housing', 'Food', 'Transport', 
  'Health', 'Shopping', 'Entertainment', 'Travel', 'Utilities', 'Other'
];

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nexus-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('nexus-user'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [authError, setAuthError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [allUsers, setAllUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved ? saved === 'dark' : true;
  });

  const API_URL = 'http://127.0.0.1:8000';

  // Apply theme
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme-mode', theme);
  }, [isDarkMode]);

  // Fetch transactions
  useEffect(() => {
    if (isAuth && user) {
      fetchTransactions();
      if (user.role === 'admin') {
        fetchUserCount();
        fetchAllUsers();
      }
    }
  }, [isAuth, user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/transactions?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCount = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users/count`);
      if (response.ok) {
        const data = await response.json();
        setUserCount(data.total_users);
      }
    } catch (error) {
      console.error("Error fetching user count:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleBlockUser = async (targetUserId) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${targetUserId}/block?admin_id=${user.id}`, {
        method: 'PUT'
      });
      if (response.ok) {
        fetchAllUsers();
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleDeleteUser = async (targetUserId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`${API_URL}/admin/users/${targetUserId}?admin_id=${user.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchAllUsers();
        fetchUserCount();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      setAuthError("");
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuth(true);
        localStorage.setItem('nexus-user', JSON.stringify(userData));
      } else {
        const error = await response.json();
        setAuthError(error.detail || "Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setAuthError(`Connection failed: ${error.message}`);
    }
  };

  const handleRegister = async (userData) => {
    try {
      setAuthError("");
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        alert("Registration successful! Please login.");
        return true;
      } else {
        const error = await response.json();
        let errorMsg = "Registration failed";
        
        if (error.detail) {
          if (Array.isArray(error.detail)) {
            // Handle validation errors from Pydantic
            errorMsg = error.detail.map(e => e.msg || e).join(", ");
          } else {
            // Handle regular error messages
            errorMsg = error.detail;
          }
        }
        
        setAuthError(errorMsg);
        return false;
      }
    } catch (error) {
      console.error("Register Error:", error);
      setAuthError(`Connection failed: ${error.message}`);
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuth(false);
    localStorage.removeItem('nexus-user');
  };

  const handleAddTransaction = async (formData) => {
    try {
      const txData = {
        ...formData,
        id: editingTx ? editingTx.id : `tx-${Date.now()}`
      };

      const url = editingTx ? `${API_URL}/transactions/${editingTx.id}` : `${API_URL}/transactions`;
      const method = editingTx ? 'PUT' : 'POST';

      const response = await fetch(`${url}?user_id=${user.id}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });

      if (response.ok) {
        fetchTransactions();
        setIsModalOpen(false);
        setEditingTx(null);
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      const response = await fetch(`${API_URL}/transactions/${id}?user_id=${user.id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  // Memoized stats and filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || tx.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType]);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    // Category Breakdown for Pie Chart
    const categoryMap = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const pieData = Object.keys(categoryMap).map(cat => ({ name: cat, value: categoryMap[cat] }));

    // Trend Data for Area Chart
    const trendMap = {};
    transactions.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!trendMap[dateKey]) trendMap[dateKey] = { date: dateKey, balance: 0 };
      trendMap[dateKey].balance += (t.type === 'income' ? t.amount : -t.amount);
    });
    const trendData = Object.values(trendMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      totalBalance: income - expense,
      totalIncome: income,
      totalExpense: expense,
      savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
      pieData,
      trendData
    };
  }, [transactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isAuth) return (
    <AuthPage 
      onLogin={handleLogin} 
      onRegister={handleRegister} 
      authError={authError}
      isDarkMode={isDarkMode}
      onThemeToggle={() => setIsDarkMode(!isDarkMode)}
    />
  );

  // Admin Panel View
  if (user.role === 'admin' && currentPage === 'admin') {
    return (
      <div className="app-container">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-card" 
          style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: '12px' }}>
              <Wallet size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ADMIN PANEL
              </h1>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>System Management</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setCurrentPage('dashboard')}>
              Back to Dashboard
            </button>
            
            <button 
              className="icon-btn" 
              style={{ color: 'var(--text-main)', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer' }} 
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>{user.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>{user.role}</p>
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                {user.name.charAt(0)}
              </div>
              <button 
                className="icon-btn" 
                style={{ color: 'var(--expense)', marginLeft: '8px', padding: '4px' }} 
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </motion.header>

        {/* User Stats */}
        <div className="grid-layout" style={{ marginBottom: '40px' }}>
          <StatCard title="Total Users" value={userCount} icon={<Users size={20} />} className="col-span-12" delay={0} />
        </div>

        {/* Users List */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass glass-card"
        >
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="var(--primary)" /> All Users
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence mode='popLayout'>
              {allUsers.length > 0 ? allUsers.map((u, idx) => (
                <motion.div 
                  key={u.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass" 
                  style={{ padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '44px', height: '44px', borderRadius: '12px', 
                      background: u.is_blocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                      color: u.is_blocked ? 'var(--expense)' : 'var(--income)',
                      display: 'grid', placeItems: 'center' 
                    }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{u.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.email} • {u.role} {u.is_blocked ? '(BLOCKED)' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="icon-btn" 
                      style={{ color: u.is_blocked ? 'var(--income)' : 'var(--expense)' }} 
                      onClick={() => handleBlockUser(u.id)}
                      title={u.is_blocked ? "Unblock" : "Block"}
                    >
                      {u.is_blocked ? "✓ Unblock" : "✕ Block"}
                    </button>
                    <button 
                      className="icon-btn" 
                      style={{ color: 'var(--expense)' }} 
                      onClick={() => handleDeleteUser(u.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  No users found.
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glass-card" 
        style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: '12px' }}>
            <Wallet size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FINANCE TRACKER
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Welcome back, {user.name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {user.role !== 'viewer' && (
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setEditingTx(null); setIsModalOpen(true); }}>
              <Plus size={18} /> New Transaction
            </button>
          )}
          
          {user.role === 'admin' && (
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--secondary)' }} onClick={() => setCurrentPage('admin')}>
              Admin Panel
            </button>
          )}
          
          <button 
            className="icon-btn" 
            style={{ color: 'var(--text-main)', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer' }} 
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>{user.role}</p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
              {user.name.charAt(0)}
            </div>
            <button 
              className="icon-btn" 
              style={{ color: 'var(--expense)', marginLeft: '8px', padding: '4px' }} 
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Stats Grid */}
      <div className="grid-layout" style={{ marginBottom: '40px' }}>
        <StatCard title="Total Balance" value={formatCurrency(stats.totalBalance)} icon={<Wallet size={20} />} className="col-span-3" delay={0} />
        <StatCard title="Monthly Income" value={formatCurrency(stats.totalIncome)} icon={<TrendingUp size={20} />} className="col-span-3" color="income" delay={0.1} />
        <StatCard title="Monthly Expense" value={formatCurrency(stats.totalExpense)} icon={<TrendingDown size={20} />} className="col-span-3" color="expense" delay={0.2} />
        {user.role === 'admin' && (
          <StatCard title="Total Users" value={userCount} icon={<Users size={20} />} className="col-span-3" delay={0.3} />
        )}
        {user.role !== 'admin' && (
          <StatCard title="Savings Rate" value={`${stats.savingsRate}%`} icon={<Target size={20} />} className="col-span-3" delay={0.3} />
        )}
      </div>

      {/* Main Content */}
      <div className="grid-layout">
        {/* Left: Transaction History & Trend */}
        <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Trend Chart */}
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass glass-card"
          >
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 size={20} color="var(--primary)" /> Balance Trend
              </h3>
            </div>
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 12}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: '#1e1b4b', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Ledger */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass glass-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Transactions Ledger</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input 
                    className="glass-input" 
                    placeholder="Search..." 
                    style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="glass-input" 
                  style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence mode='popLayout'>
                {filteredTransactions.length > 0 ? filteredTransactions.map((tx, idx) => (
                  <motion.div 
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass" 
                    style={{ padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '44px', height: '44px', borderRadius: '12px', 
                        background: tx.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)',
                        display: 'grid', placeItems: 'center' 
                      }}>
                        {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600 }}>{tx.description}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={12} /> {new Date(tx.date).toLocaleDateString()} • {tx.category}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                      {user.role !== 'viewer' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="icon-btn" style={{ color: 'var(--text-dim)' }} onClick={() => { setEditingTx(tx); setIsModalOpen(true); }}><Edit2 size={16} /></button>
                          <button className="icon-btn" style={{ color: 'var(--expense)' }} onClick={() => handleDeleteTransaction(tx.id)}><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No transactions found matching your criteria.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>

        {/* Right: Category Pie & AI Insight */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pie Chart */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass glass-card"
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PieIcon size={20} color="var(--secondary)" /> Expense Breakdown
            </h3>
            <div style={{ height: '220px', width: '100%' }}>
              {stats.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1e1b4b', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                  No data available
                </div>
              )}
            </div>
            {/* Custom Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              {stats.pieData.slice(0, 4).map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }}></div>
                  <span style={{ color: 'var(--text-dim)' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass glass-card" 
            style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba( ec4899, 0.1) 100%)' }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={20} color="var(--primary)" /> Smart Insights
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
              {stats.totalBalance >= 0 
                ? "Your cash flow is healthy. Consider moving surplus funds to high-yield investments."
                : "Your spending has exceeded income this month. Review your 'Food' and 'Shopping' categories for savings."}
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setIsReportOpen(true)}>
              View full report <ChevronRight size={16} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass glass-card" 
              style={{ width: '420px', background: '#1e1b4b' }}
            >
              <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: 700 }}>{editingTx ? 'Edit Transaction' : 'New Transaction'}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddTransaction({
                  description: formData.get('description'),
                  amount: Number(formData.get('amount')),
                  category: formData.get('category'),
                  type: formData.get('type'),
                  date: formData.get('date'),
                  notes: formData.get('notes')
                });
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="field-group">
                  <span className="card-title">Description</span>
                  <input name="description" className="glass-input" style={{width: '100%'}} defaultValue={editingTx?.description} placeholder="e.g. Grocery Shopping" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="field-group">
                    <span className="card-title">Amount (₹)</span>
                    <input name="amount" type="number" className="glass-input" style={{width: '100%'}} defaultValue={editingTx?.amount} placeholder="0.00" required />
                  </div>
                  <div className="field-group">
                    <span className="card-title">Type</span>
                    <select name="type" className="glass-input" style={{width: '100%'}} defaultValue={editingTx?.type || 'expense'}>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="field-group">
                    <span className="card-title">Category</span>
                    <select name="category" className="glass-input" style={{width: '100%'}} defaultValue={editingTx?.category || 'Food'}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <span className="card-title">Date</span>
                    <input name="date" type="date" className="glass-input" style={{width: '100%'}} defaultValue={editingTx?.date || new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>
                <div className="field-group">
                  <span className="card-title">Notes</span>
                  <textarea name="notes" className="glass-input" style={{width: '100%'}} defaultValue={editingTx?.notes} placeholder="Additional details..." rows="2" />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="glass-input" style={{ flex: 1, cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingTx ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass glass-card" 
              style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto', background: '#1e1b4b' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ marginBottom: 0, fontSize: '1.5rem', fontWeight: 700 }}>Financial Report</h2>
                <button onClick={() => setIsReportOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
                    <div>
                      <p style={{ color: 'var(--text-dim)', margin: 0 }}>Total Income</p>
                      <p style={{ color: 'var(--income)', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{formatCurrency(stats.totalIncome)}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-dim)', margin: 0 }}>Total Expense</p>
                      <p style={{ color: 'var(--expense)', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{formatCurrency(stats.totalExpense)}</p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Insights</h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>
                    {stats.totalBalance >= 0 
                      ? `You have a positive cash flow of ${formatCurrency(stats.totalBalance)}. This is excellent! Consider investing this surplus in high-yield opportunities like mutual funds, stocks, or savings accounts with better interest rates.`
                      : `Your expenses exceeded income by ${formatCurrency(Math.abs(stats.totalBalance))}. Review your spending patterns, especially in Food and Shopping categories, to identify areas where you can cut costs.`}
                  </p>
                </div>

                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Category Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stats.pieData.slice(0, 5).map(item => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-dim)' }}>{item.name}</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setIsReportOpen(false)} 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, className = '', color = '', delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass glass-card ${className}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="card-title">{title}</p>
          <h2 className={`card-value ${color === 'income' ? 'income-text' : color === 'expense' ? 'expense-text' : ''}`}>
            {value}
          </h2>
        </div>
        <div style={{ 
          padding: '8px', 
          background: color === 'income' ? 'rgba(16, 185, 129, 0.1)' : color === 'expense' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
          color: color === 'income' ? 'var(--income)' : color === 'expense' ? 'var(--expense)' : 'var(--primary)',
          borderRadius: '10px' 
        }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function AuthPage({ onLogin, onRegister, authError, isDarkMode, onThemeToggle }) {
  const [isLogin, setIsLogin] = useState(true);
  const [credentials, setCredentials] = useState({ 
    email: "chaturvedisuryakant2005@gmail.com", 
    password: "admin123",
    name: "" 
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await onLogin({ email: credentials.email, password: credentials.password });
    } else {
      const success = await onRegister(credentials);
      if (success) {
        setIsLogin(true);
        setCredentials({ 
          email: "chaturvedisuryakant2005@gmail.com", 
          password: "admin123",
          name: "" 
        });
      }
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    // Reset credentials when switching modes
    if (isLogin) {
      setCredentials({ email: "", password: "", name: "" });
    } else {
      setCredentials({ 
        email: "chaturvedisuryakant2005@gmail.com", 
        password: "admin123",
        name: "" 
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-gradient)', position: 'relative' }}>
      <button 
        style={{ position: 'absolute', top: '24px', right: '24px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={onThemeToggle}
        title={isDarkMode ? "Light Mode" : "Dark Mode"}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass glass-card" 
        style={{ width: '400px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '18px', display: 'grid', placeItems: 'center', margin: '0 auto 16px', boxShadow: '0 0 20px var(--primary-glow)' }}>
            <Wallet size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FINANCE TRACKER
          </h1>
          <p style={{ color: 'var(--text-dim)' }}>{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <input 
              className="glass-input" 
              placeholder="Full Name" 
              required
              value={credentials.name}
              onChange={(e) => setCredentials({...credentials, name: e.target.value})}
            />
          )}
          <input 
            className="glass-input" 
            type="email" 
            placeholder="Email Address" 
            required
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          />
          <input 
            className="glass-input" 
            type="password" 
            placeholder="Password" 
            required
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
          
          {authError && <p style={{ color: 'var(--expense)', fontSize: '0.875rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{authError}</p>}
          
          <button type="submit" className="btn-primary" style={{ fontSize: '1rem', padding: '14px' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, marginLeft: '8px', cursor: 'pointer' }} onClick={handleToggleMode}>
            {isLogin ? 'Register Now' : 'Login Here'}
          </button>
        </p>

        {/* Viewer Credentials Section */}
        <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>👁️ Viewer Credentials</p>
          
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '8px', border: '1px solid var(--primary)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', margin: '3px 0', wordBreak: 'break-all' }}>
              <span style={{ color: 'var(--text-dim)' }}>Email:</span> <strong>viewer@example.com</strong>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', margin: '3px 0' }}>
              <span style={{ color: 'var(--text-dim)' }}>Password:</span> <strong>viewer123</strong>
            </p>
          </div>
          
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: '12px 0 0 0', lineHeight: '1.4' }}>
            Read-only access - view transactions without edit or delete permissions.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
